// Yahoo Finance chart API — keyless primary price provider (equities by
// ISIN/exchange suffix, crypto dash pairs, metal futures, FX crosses).
// Unofficial endpoint: keep traffic low and cache symbol resolution.

import type { Quote } from './priceService';

const CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search';
const REQUEST_TIMEOUT_MS = 8_000;

// Yahoo needs the listing-specific symbol (CSPX.AS, VUAA.DE…). Suffixes to
// try, ordered by how likely that listing is to quote in the asset's currency.
const SUFFIXES_BY_CURRENCY: Record<string, string[]> = {
  EUR: ['.AS', '.DE', '.MI', '.PA', ''],
  USD: ['', '.L'],
  GBP: ['.L', ''],
  CHF: ['.SW', ''],
};

// bare symbol + currency → resolved Yahoo symbol, kept for the process lifetime.
const resolvedCache = new Map<string, string>();

interface ChartMeta {
  currency?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
}

async function fetchMeta(symbol: string): Promise<ChartMeta | null> {
  try {
    const res = await fetch(`${CHART_URL}/${encodeURIComponent(symbol)}?interval=1d&range=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; enclave-portfolio)' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { chart?: { result?: Array<{ meta?: ChartMeta }> } };
    return body.chart?.result?.[0]?.meta ?? null;
  } catch {
    return null;
  }
}

function toQuote(meta: ChartMeta, wantCurrency: string): Quote | null {
  let price = meta.regularMarketPrice;
  let currency = meta.currency ?? '';
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null;
  let prev = meta.chartPreviousClose ?? meta.previousClose;
  // LSE equities quote in pence (GBp) — normalise to pounds.
  if (currency === 'GBp') {
    price /= 100;
    if (typeof prev === 'number') prev /= 100;
    currency = 'GBP';
  }
  if (wantCurrency && currency && currency !== wantCurrency) return null;
  const changePercent = typeof prev === 'number' && prev > 0 ? (price / prev - 1) * 100 : null;
  return { price, changePercent, currency: currency || null };
}

// Resolve an ISIN to its Yahoo listings — exact-instrument match, no ticker
// collisions across exchanges.
async function searchSymbolsByIsin(isin: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${SEARCH_URL}?q=${encodeURIComponent(isin)}&quotesCount=6&newsCount=0`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; enclave-portfolio)' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );
    if (!res.ok) return [];
    const body = (await res.json()) as { quotes?: Array<{ symbol?: string }> };
    return (body.quotes ?? [])
      .map(q => q.symbol)
      .filter((s): s is string => typeof s === 'string' && s.length > 0);
  } catch {
    return [];
  }
}

// Quote a known Yahoo symbol as-is (GC=F, SI=F, USDEUR=X…): no candidate
// probing, no currency filtering — the caller knows what it asked for.
export async function fetchYahooDirect(symbol: string): Promise<Quote | null> {
  const meta = await fetchMeta(symbol);
  return meta && toQuote(meta, '');
}

export async function fetchYahooQuote(
  bareSymbol: string,
  wantCurrency: string,
  isin?: string | null,
  isCrypto = false,
): Promise<Quote | null> {
  const cacheKey = `${isin || bareSymbol}:${wantCurrency}`;
  const cached = resolvedCache.get(cacheKey);
  if (cached) {
    const meta = await fetchMeta(cached);
    const quote = meta && toQuote(meta, wantCurrency);
    if (quote) return quote;
    resolvedCache.delete(cacheKey); // listing gone — fall through and re-resolve
  }

  // Crypto quotes as dash pairs (USDC-EUR). For equities: ISIN listings first
  // (exact instrument), then suffix probing as backup — it can hit same-ticker
  // lookalikes, but the currency check filters most of them.
  let candidates: string[];
  if (isCrypto) {
    candidates = [`${bareSymbol}-${wantCurrency}`];
  } else {
    const suffixCandidates = (SUFFIXES_BY_CURRENCY[wantCurrency] ?? ['']).map(s => `${bareSymbol}${s}`);
    const isinCandidates = isin ? await searchSymbolsByIsin(isin) : [];
    candidates = [...new Set([...isinCandidates, ...suffixCandidates])];
  }

  for (const candidate of candidates) {
    if (candidate === cached) continue;
    const meta = await fetchMeta(candidate);
    const quote = meta && toQuote(meta, wantCurrency);
    if (quote) {
      resolvedCache.set(cacheKey, candidate);
      return quote;
    }
  }
  return null;
}
