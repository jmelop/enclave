import { useEffect, useState } from 'react';

// Shared client for the options module settings. Consumed by the nav, the
// portal grid, and any module that wants the user's preferences.

export interface EnclaveSettings {
  theme: 'dark' | 'light';
  currency: 'EUR' | 'USD' | 'GBP';
  disabledModules: string[];
  priceApiEnabled: boolean;
  priceApiKey: string;
}

export const DEFAULT_SETTINGS: EnclaveSettings = {
  theme: 'dark',
  currency: 'EUR',
  disabledModules: [],
  priceApiEnabled: false,
  priceApiKey: '',
};

export const CURRENCY_SYMBOLS: Record<EnclaveSettings['currency'], string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

const SETTINGS_EVENT = 'enclave-settings-changed';

let cache: EnclaveSettings | null = null;

export async function fetchEnclaveSettings(): Promise<EnclaveSettings> {
  try {
    const res = await fetch('/api/options/settings');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as Partial<EnclaveSettings>;
    cache = { ...DEFAULT_SETTINGS, ...body };
  } catch {
    cache = cache ?? DEFAULT_SETTINGS;
  }
  return cache;
}

// Applies a settings object to the running app: theme attribute plus
// localStorage mirrors (read synchronously by modules, e.g. currency
// formatting), then notifies every mounted useEnclaveSettings hook.
export function applyEnclaveSettings(settings: EnclaveSettings): void {
  cache = settings;
  try {
    document.documentElement.setAttribute('data-theme', settings.theme);
    localStorage.setItem('enclave-theme', settings.theme);
    localStorage.setItem('enclave-currency', settings.currency);
    localStorage.setItem('enclave-currency-symbol', CURRENCY_SYMBOLS[settings.currency] ?? '€');
  } catch { /* non-browser context */ }
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }));
}

export function useEnclaveSettings(): EnclaveSettings {
  const [settings, setSettings] = useState<EnclaveSettings>(cache ?? DEFAULT_SETTINGS);

  useEffect(() => {
    let alive = true;
    if (!cache) {
      void fetchEnclaveSettings().then(s => { if (alive) setSettings(s); });
    }
    const onChange = (e: Event) => setSettings({ ...(e as CustomEvent<EnclaveSettings>).detail });
    window.addEventListener(SETTINGS_EVENT, onChange);
    return () => {
      alive = false;
      window.removeEventListener(SETTINGS_EVENT, onChange);
    };
  }, []);

  return settings;
}
