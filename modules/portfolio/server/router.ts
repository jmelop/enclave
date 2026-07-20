import { Router } from 'express';
import { randomUUID } from 'crypto';
import type { DbPool, AssetInput } from '@enclave/sdk';
import { INITIAL_ASSETS, INITIAL_SNAPSHOTS } from './seed';
import { fetchQuotes, providerSymbol, PriceApiError, type Quote } from './services/priceService';
import { fetchYahooQuote } from './services/yahooService';

const VALID_TYPES = new Set([
  'stock', 'fund', 'crypto', 'savings', 'realestate', 'collectible', 'investment',
]);

type AssetRow = Record<string, unknown>;

const FX_TO_EUR: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
  CHF: 1.06,
};

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  return Number(v);
}

function mapAsset(row: AssetRow) {
  return {
    id:               row['id'] as string,
    type:             row['type'] as string,
    name:             row['name'] as string,
    description:      (row['description'] ?? null) as string | null,
    currency:         row['currency'] as string,
    symbol:           (row['symbol'] ?? null) as string | null,
    price:            toNumber(row['price']),
    quantity:         toNumber(row['quantity']),
    changePercent24h: toNumber(row['change_pct_24h']),
    institution:      (row['institution'] ?? null) as string | null,
    isin:             (row['isin'] ?? null) as string | null,
    ter:              toNumber(row['ter']),
    distribution:     (row['distribution'] ?? null) as string | null,
    amount:           toNumber(row['amount']),
    subtype:          (row['subtype'] ?? null) as string | null,
    valuationDate:    row['valuation_date'] ?? null,
    apy:              toNumber(row['apy']),
    updatedAt:        row['updated_at'] ?? null,
  };
}

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function currentDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });
}

function mapSnapshot(row: AssetRow) {
  const key = row['month_key'] as string;
  const rawDate = row['snapshot_date'];
  const snapshotDate = rawDate instanceof Date
    ? rawDate.toISOString().slice(0, 10)
    : String(rawDate).slice(0, 10);

  return {
    monthKey: key,
    label: monthLabel(key),
    year: parseInt(key.slice(0, 4), 10),
    snapshotDate,
    totalValue: Number(row['total_value_eur']),
    assetCount: Number(row['asset_count']),
    note: String(row['note'] ?? ''),
  };
}

function assetValueEUR(row: AssetRow): number {
  const price = toNumber(row['price']);
  const quantity = toNumber(row['quantity']);
  const amount = toNumber(row['amount']);
  const currency = String(row['currency'] ?? 'EUR');
  const value = price != null && quantity != null ? price * quantity : (amount ?? 0);
  return value * (FX_TO_EUR[currency] ?? 1);
}

async function getCurrentHoldings(pool: DbPool): Promise<AssetRow[]> {
  const { rows } = await pool.query('SELECT * FROM assets ORDER BY type, id');
  return rows.length > 0 ? rows : INITIAL_ASSETS as AssetRow[];
}

async function upsertCurrentSnapshot(pool: DbPool): Promise<AssetRow> {
  const holdings = await getCurrentHoldings(pool);
  const total = Math.round(holdings.reduce((sum, asset) => sum + assetValueEUR(asset), 0) * 100) / 100;
  const monthKey = currentMonthKey();
  const snapshotDate = currentDateKey();

  const { rows } = await pool.query(
    `INSERT INTO portfolio_month_snapshots
       (month_key, snapshot_date, total_value_eur, asset_count, note)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (month_key) DO UPDATE
       SET snapshot_date = EXCLUDED.snapshot_date,
           total_value_eur = EXCLUDED.total_value_eur,
           asset_count = EXCLUDED.asset_count,
           note = EXCLUDED.note,
           updated_at = NOW()
     RETURNING *`,
    [monthKey, snapshotDate, total, holdings.length, 'Automatic monthly snapshot'],
  );

  return rows[0];
}

async function getPriceApiSettings(pool: DbPool): Promise<{ enabled: boolean; apiKey: string }> {
  const { rows } = await pool.query(
    `SELECT key, value FROM options_settings WHERE key IN ('priceApiEnabled', 'priceApiKey')`,
  );
  const stored = Object.fromEntries(rows.map(r => [r['key'] as string, r['value']]));
  return {
    enabled: stored['priceApiEnabled'] === true,
    apiKey: typeof stored['priceApiKey'] === 'string' ? stored['priceApiKey'] : '',
  };
}

async function ensureCurrentMonthSnapshot(pool: DbPool): Promise<void> {
  const monthKey = currentMonthKey();
  const { rows } = await pool.query(
    'SELECT 1 FROM portfolio_month_snapshots WHERE month_key = $1 LIMIT 1',
    [monthKey],
  );
  if (rows.length > 0) return;

  await upsertCurrentSnapshot(pool);
}

export function createPortfolioRouter(pool: DbPool): Router {
  const router = Router();

  router.get('/holdings', async (_req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM assets ORDER BY type, id');
      res.json(rows.length > 0 ? rows.map(mapAsset) : INITIAL_ASSETS);
    } catch (err) {
      console.warn('[portfolio] /holdings db unavailable, using seed:', err);
      res.json(INITIAL_ASSETS);
    }
  });

  router.get('/history', async (_req, res) => {
    try {
      await ensureCurrentMonthSnapshot(pool);

      const { rows } = await pool.query(
        'SELECT * FROM portfolio_month_snapshots ORDER BY month_key ASC',
      );

      return res.json(rows.length > 0 ? rows.map(mapSnapshot) : INITIAL_SNAPSHOTS);
    } catch (err) {
      console.warn('[portfolio] /history db unavailable, using seed:', err);
      return res.json(INITIAL_SNAPSHOTS);
    }
  });

  router.post('/prices/refresh', async (_req, res) => {
    let settings: { enabled: boolean; apiKey: string };
    let holdings: AssetRow[];
    try {
      settings = await getPriceApiSettings(pool);
      // Stalest first: with the per-minute credit cap, consecutive refreshes
      // rotate through the whole portfolio instead of re-quoting the same rows.
      // Gold/silver collectibles with a weight are valued at spot.
      const { rows } = await pool.query(
        `SELECT id, type, subtype, symbol, currency, quantity, isin FROM assets
         WHERE (symbol IS NOT NULL AND type IN ('stock', 'fund', 'crypto'))
            OR (type = 'collectible' AND subtype IN ('gold', 'silver')
                AND quantity IS NOT NULL AND quantity > 0)
         ORDER BY updated_at ASC NULLS FIRST`,
      );
      holdings = rows;
    } catch (err) {
      console.warn('[portfolio] POST /prices/refresh db error:', err);
      return res.status(503).json({ error: 'Database unavailable, cannot refresh prices' });
    }

    if (!settings.enabled) {
      return res.status(409).json({ error: 'Live prices are disabled — enable them in Options' });
    }
    if (!settings.apiKey) {
      return res.status(409).json({ error: 'No price API key configured — add one in Options' });
    }
    if (holdings.length === 0) {
      return res.json({ updated: 0, failed: [], skipped: [] });
    }

    const METAL_PAIRS: Record<string, string> = { gold: 'XAU/USD', silver: 'XAG/USD' };
    const symbolFor = (row: AssetRow): string =>
      row['type'] === 'collectible'
        ? METAL_PAIRS[String(row['subtype'])]
        : providerSymbol(String(row['type']), String(row['symbol']), String(row['currency'] ?? ''));

    const bySymbol = new Map<string, AssetRow[]>();
    for (const row of holdings) {
      const key = symbolFor(row);
      const group = bySymbol.get(key);
      if (group) group.push(row); else bySymbol.set(key, [row]);
    }

    // Twelve Data free tier allows 8 credits/minute and a batch costs 1 credit
    // per symbol; an oversized batch is rejected whole (and still billed).
    // Metals priced in another currency also need a USD/{cur} forex quote,
    // which counts toward the same cap.
    const MAX_CREDITS_PER_REFRESH = 8;
    const batch: string[] = [];
    const skipped: string[] = [];
    const fxPairs = new Set<string>();
    for (const [symbol, rows] of bySymbol) {
      const newFx = new Set<string>();
      if (rows[0]['type'] === 'collectible') {
        for (const row of rows) {
          const cur = String(row['currency'] ?? 'USD');
          if (cur !== 'USD' && !fxPairs.has(`USD/${cur}`)) newFx.add(`USD/${cur}`);
        }
      }
      if (batch.length + fxPairs.size + newFx.size + 1 <= MAX_CREDITS_PER_REFRESH) {
        batch.push(symbol);
        newFx.forEach(fx => fxPairs.add(fx));
      } else {
        skipped.push(symbol);
      }
    }

    try {
      const quotes = await fetchQuotes([...batch, ...fxPairs], settings.apiKey);

      let updated = 0;
      const failed = new Set<string>();

      for (const symbol of batch) {
        const quote = quotes[symbol];
        const rows = bySymbol.get(symbol) ?? [];
        const isMetal = rows[0]['type'] === 'collectible';

        if (isMetal && !quote) {
          failed.add(symbol);
          continue;
        }

        for (const row of rows) {
          const assetCurrency = String(row['currency'] ?? '');

          if (isMetal && quote) {
            let price = quote.price;
            if (assetCurrency && assetCurrency !== 'USD') {
              const fx = quotes[`USD/${assetCurrency}`];
              if (!fx) {
                failed.add(`${symbol} (no USD/${assetCurrency} rate)`);
                continue;
              }
              price = price * fx.price;
            }
            // Spot value drives both the per-oz price and the total amount.
            const amount = Math.round(price * Number(row['quantity']) * 100) / 100;
            await pool.query(
              `UPDATE assets SET price = $2, change_pct_24h = $3, amount = $4, updated_at = NOW() WHERE id = $1`,
              [row['id'], price, quote.changePercent, amount],
            );
            updated += 1;
            continue;
          }

          // The primary provider resolves bare tickers to their primary
          // (usually US) listing — never write a quote in another currency.
          let effective: Quote | null =
            quote && (!quote.currency || !assetCurrency || quote.currency === assetCurrency)
              ? quote
              : null;
          // Yahoo fallback resolves the exchange listing matching the asset's
          // currency — covers non-US ETFs outside Twelve Data's free plan and
          // crypto pairs it lacks (e.g. USDC/EUR).
          if (!effective && (row['type'] === 'stock' || row['type'] === 'fund' || row['type'] === 'crypto')) {
            effective = await fetchYahooQuote(
              String(row['symbol']), assetCurrency, row['isin'] as string | null, row['type'] === 'crypto',
            );
          }
          if (!effective) {
            failed.add(quote?.currency && assetCurrency && quote.currency !== assetCurrency
              ? `${symbol} (${quote.currency} quote, asset in ${assetCurrency})`
              : symbol);
            continue;
          }
          await pool.query(
            `UPDATE assets SET price = $2, change_pct_24h = $3, updated_at = NOW() WHERE id = $1`,
            [row['id'], effective.price, effective.changePercent],
          );
          updated += 1;
        }
      }
      return res.json({ updated, failed: [...failed], skipped });
    } catch (err) {
      if (err instanceof PriceApiError) {
        return res.status(err.status).json({ error: err.message });
      }
      console.warn('[portfolio] POST /prices/refresh error:', err);
      return res.status(503).json({ error: 'Could not refresh prices' });
    }
  });

  router.post('/history/snapshot', async (_req, res) => {
    try {
      const row = await upsertCurrentSnapshot(pool);
      return res.status(201).json(mapSnapshot(row));
    } catch (err) {
      console.warn('[portfolio] POST /history/snapshot db error:', err);
      return res.status(503).json({ error: 'Database unavailable, cannot save snapshot' });
    }
  });

  router.post('/holdings', async (req, res) => {
    const input = req.body as AssetInput;

    if (!VALID_TYPES.has(input.type)) {
      return res.status(400).json({ error: 'Invalid asset type' });
    }
    if (!input.name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!input.currency?.trim()) {
      return res.status(400).json({ error: 'Currency is required' });
    }

    const id = randomUUID();

    try {
      const { rows } = await pool.query(
        `INSERT INTO assets (
          id, type, name, description, currency,
          symbol, price, quantity, change_pct_24h,
          isin, ter, distribution,
          amount, subtype, valuation_date,
          institution, apy, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12,
          $13, $14, $15,
          $16, $17, NOW()
        ) RETURNING *`,
        [
          id,
          input.type,
          input.name,
          input.description ?? null,
          input.currency,
          input.symbol ?? null,
          input.price ?? null,
          input.quantity ?? null,
          input.changePercent24h ?? null,
          input.isin ?? null,
          input.ter ?? null,
          input.distribution ?? null,
          input.amount ?? null,
          input.subtype ?? null,
          input.valuationDate ?? null,
          input.institution ?? null,
          input.apy ?? null,
        ],
      );
      return res.status(201).json(mapAsset(rows[0]));
    } catch (err) {
      console.warn('[portfolio] POST /holdings db error:', err);
      return res.status(503).json({ error: 'Database unavailable, cannot save asset' });
    }
  });

  router.put('/holdings/:id', async (req, res) => {
    const { id } = req.params;
    const input = req.body as AssetInput;

    if (!VALID_TYPES.has(input.type)) {
      return res.status(400).json({ error: 'Invalid asset type' });
    }
    if (!input.name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!input.currency?.trim()) {
      return res.status(400).json({ error: 'Currency is required' });
    }

    try {
      const { rows } = await pool.query(
        `UPDATE assets SET
          type=$2, name=$3, description=$4, currency=$5,
          symbol=$6, price=$7, quantity=$8, change_pct_24h=$9,
          isin=$10, ter=$11, distribution=$12,
          amount=$13, subtype=$14, valuation_date=$15,
          institution=$16, apy=$17, updated_at=NOW()
        WHERE id=$1
        RETURNING *`,
        [
          id,
          input.type,
          input.name,
          input.description ?? null,
          input.currency,
          input.symbol ?? null,
          input.price ?? null,
          input.quantity ?? null,
          input.changePercent24h ?? null,
          input.isin ?? null,
          input.ter ?? null,
          input.distribution ?? null,
          input.amount ?? null,
          input.subtype ?? null,
          input.valuationDate ?? null,
          input.institution ?? null,
          input.apy ?? null,
        ],
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      return res.status(200).json(mapAsset(rows[0]));
    } catch (err) {
      console.warn('[portfolio] PUT /holdings/:id db error:', err);
      return res.status(503).json({ error: 'Database unavailable, cannot update asset' });
    }
  });

  router.delete('/holdings/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const { rows } = await pool.query(
        'DELETE FROM assets WHERE id = $1 RETURNING id',
        [id],
      );
      // DELETE is idempotent: 204 whether the row existed or not.
      // When the DB is empty, GET falls back to in-memory seed assets whose
      // IDs (e.g. "s1") don't exist in the DB — returning 404 here would
      // incorrectly surface an error to the user.
      void rows; // RETURNING id used only to confirm query ran
      return res.status(204).end();
    } catch (err) {
      console.warn('[portfolio] DELETE /holdings/:id db error:', err);
      return res.status(503).json({ error: 'Database unavailable, cannot delete asset' });
    }
  });

  return router;
}
