import { useEffect, useRef, useState } from 'react';
import { Card, useToast } from '@venator-ui/ui';
import { Moon, Sun, Coins, LayoutGrid, Palette } from 'lucide-react';
import {
  applyEnclaveSettings,
  fetchEnclaveSettings,
  CURRENCY_SYMBOLS,
  type EnclaveSettings,
} from '@enclave/ui-shell';
import { clientModules } from '../../../enclave.modules.client';

const CURRENCIES: EnclaveSettings['currency'][] = ['EUR', 'USD', 'GBP'];

export default function OptionsApp() {
  const [settings, setSettings] = useState<EnclaveSettings | null>(null);
  // Handlers read through the ref so rapid consecutive changes never build on
  // a stale render closure (the second change would revert the first one).
  const settingsRef = useRef<EnclaveSettings | null>(null);
  settingsRef.current = settings;
  const { toast } = useToast();

  useEffect(() => { void fetchEnclaveSettings().then(setSettings); }, []);

  const putSetting = async <K extends keyof EnclaveSettings>(key: K, value: EnclaveSettings[K]) => {
    const prev = settingsRef.current;
    if (!prev) return;
    const next = { ...prev, [key]: value };
    settingsRef.current = next;
    setSettings(next);
    applyEnclaveSettings(next);
    try {
      const res = await fetch(`/api/options/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
    } catch (err) {
      const reverted = { ...(settingsRef.current ?? next), [key]: prev[key] };
      settingsRef.current = reverted;
      setSettings(reverted);
      applyEnclaveSettings(reverted);
      toast({
        title: err instanceof Error ? err.message : 'Error saving setting',
        variant: 'error',
      });
    }
  };

  const toggleModule = (id: string) => {
    const current = settingsRef.current;
    if (!current) return;
    const disabled = current.disabledModules.includes(id)
      ? current.disabledModules.filter(m => m !== id)
      : [...current.disabledModules, id];
    void putSetting('disabledModules', disabled);
  };

  const togglableModules = clientModules.filter(m => m.id !== 'options');

  return (
    <div className="options-app">
      <div className="canvas with-grid">
        {/* v-topbar */}
        <div className="v-topbar">
          <span className="crumb">enclave</span>
          <span className="sep">/</span>
          <span className="crumb active">options</span>
          <span className="v-cursor">▊</span>
          <span className="spacer" />
          <span className="pill"><span className="dot" />synced</span>
          <span style={{ color: 'var(--fg-5)' }}>·</span>
          <span>{new Date().toLocaleDateString('sv-SE')}</span>
        </div>

        {/* page hero */}
        <header className="hero">
          <div className="hero-tag mono">// MODULE · enclave-options</div>
          <div className="hero-row">
            <h1 className="hero-title">Options<span className="hero-dot">.</span></h1>
          </div>
          <div className="hero-sub">
            Shell-wide preferences: module visibility, appearance, and regional defaults.
          </div>
        </header>

        {!settings ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>
            Loading options…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              {/* Appearance */}
              <Card padding="none">
                <div className="opt-card-head">
                  <Palette size={14} />
                  <div>
                    <h3>Appearance</h3>
                    <p className="mono">Theme applied when the app loads</p>
                  </div>
                </div>
                <div className="opt-card-body">
                  <div className="opt-seg-row">
                    <button
                      type="button"
                      className={`opt-seg ${settings.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => void putSetting('theme', 'dark')}
                    >
                      <Moon size={14} /> Dark
                    </button>
                    <button
                      type="button"
                      className={`opt-seg ${settings.theme === 'light' ? 'active' : ''}`}
                      onClick={() => void putSetting('theme', 'light')}
                    >
                      <Sun size={14} /> Light
                    </button>
                  </div>
                </div>
              </Card>

              {/* Currency */}
              <Card padding="none">
                <div className="opt-card-head">
                  <Coins size={14} />
                  <div>
                    <h3>Currency</h3>
                    <p className="mono">Symbol used for money formatting</p>
                  </div>
                </div>
                <div className="opt-card-body">
                  <div className="opt-seg-row">
                    {CURRENCIES.map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`opt-seg ${settings.currency === c ? 'active' : ''}`}
                        onClick={() => void putSetting('currency', c)}
                      >
                        <span className="mono" style={{ fontSize: 13 }}>{CURRENCY_SYMBOLS[c]}</span> {c}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Modules */}
            <Card padding="none">
              <div className="opt-card-head">
                <LayoutGrid size={14} />
                <div>
                  <h3>Modules</h3>
                  <p className="mono">Disabled modules disappear from the menu and the portal</p>
                </div>
              </div>
              <div style={{ padding: '4px 18px 14px' }}>
                {togglableModules.map(mod => {
                  const enabled = !settings.disabledModules.includes(mod.id);
                  return (
                    <div key={mod.id} className="opt-module-row">
                      <span className="opt-module-dot" style={{ background: mod.accent }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{mod.navLabel}</div>
                        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>{mod.basePath} · {mod.nav.length} view{mod.nav.length === 1 ? '' : 's'}</div>
                      </div>
                      <span className="mono" style={{ fontSize: 10.5, color: enabled ? 'var(--success)' : 'var(--fg-4)' }}>
                        {enabled ? 'ENABLED' : 'HIDDEN'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`Toggle ${mod.navLabel}`}
                        className={`opt-switch ${enabled ? 'on' : ''}`}
                        onClick={() => toggleModule(mod.id)}
                      >
                        <span className="opt-switch-knob" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>

            <footer className="page-foot mono">
              <span>END · {togglableModules.length} modules · {settings.disabledModules.length} hidden</span>
              <span className="dim">enclave/options · build 2026.07</span>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
