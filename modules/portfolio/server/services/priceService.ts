// Twelve Data quote client — one free API key covers stocks, ETFs and crypto.
// https://twelvedata.com/docs#quote

const BASE_URL = 'https://api.twelvedata.com/quote';
const REQUEST_TIMEOUT_MS = 10_000;

export interface Quote {
  price: number;
  changePercent: number | null;
}

export class PriceApiError extends Error {
  constructor(message: string, readonly status: number = 502) {
    super(message);
    this.name = 'PriceApiError';
  }
}

// Twelve Data quotes crypto as a pair ("BTC/USD"); stocks and funds by ticker.
export function providerSymbol(type: string, symbol: string, currency: string): string {
  return type === 'crypto' ? `${symbol}/${currency || 'USD'}` : symbol;
}

interface RawQuote {
  status?: string;
  code?: number;
  message?: string;
  symbol?: string;
  close?: string;
  percent_change?: string;
}

function parseQuote(raw: RawQuote): Quote | null {
  const price = Number(raw.close);
  if (!Number.isFinite(price) || price <= 0) return null;
  const change = Number(raw.percent_change);
  return { price, changePercent: Number.isFinite(change) ? change : null };
}

// Returns quotes keyed by provider symbol; symbols the provider could not
// resolve are simply absent. Throws PriceApiError on transport/auth failures.
export async function fetchQuotes(symbols: string[], apiKey: string): Promise<Record<string, Quote>> {
  if (symbols.length === 0) return {};

  const url = `${BASE_URL}?symbol=${encodeURIComponent(symbols.join(','))}&apikey=${encodeURIComponent(apiKey)}`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    throw new PriceApiError(
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Price provider timed out'
        : 'Could not reach price provider',
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw new PriceApiError('Price API key rejected — check it in Options');
  }
  if (res.status === 429) {
    throw new PriceApiError('Price API rate limit reached, try again in a minute');
  }
  if (!res.ok) throw new PriceApiError(`Price provider returned HTTP ${res.status}`);

  const body = (await res.json()) as RawQuote | Record<string, RawQuote>;

  // Top-level error (bad/expired key, rate limit…) applies to the whole call.
  if ('status' in body && body.status === 'error') {
    const { code, message } = body as RawQuote;
    if (code === 401 || code === 403) throw new PriceApiError('Price API key rejected — check it in Options');
    if (code === 429) throw new PriceApiError('Price API rate limit reached, try again in a minute');
    throw new PriceApiError(message ?? 'Price provider error');
  }

  const quotes: Record<string, Quote> = {};

  if (symbols.length === 1) {
    const quote = parseQuote(body as RawQuote);
    if (quote) quotes[symbols[0]] = quote;
    return quotes;
  }

  for (const symbol of symbols) {
    const entry = (body as Record<string, RawQuote>)[symbol];
    if (!entry || entry.status === 'error') continue;
    const quote = parseQuote(entry);
    if (quote) quotes[symbol] = quote;
  }
  return quotes;
}
