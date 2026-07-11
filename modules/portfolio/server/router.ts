import { Router } from 'express';
import { randomUUID } from 'crypto';
import type { DbPool, AssetInput } from '@enclave/sdk';
import { INITIAL_ASSETS, INITIAL_SNAPSHOTS } from './seed';

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
