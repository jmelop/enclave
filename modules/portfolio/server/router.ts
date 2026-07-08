import { Router } from 'express';
import { randomUUID } from 'crypto';
import type { DbPool, AssetInput } from '@enclave/sdk';
import { INITIAL_ASSETS } from './seed';

const VALID_TYPES = new Set([
  'stock', 'fund', 'crypto', 'savings', 'realestate', 'collectible', 'investment',
]);

type AssetRow = Record<string, unknown>;

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
    custody:          (row['custody'] ?? null) as string | null,
    isin:             (row['isin'] ?? null) as string | null,
    ter:              toNumber(row['ter']),
    distribution:     (row['distribution'] ?? null) as string | null,
    amount:           toNumber(row['amount']),
    subtype:          (row['subtype'] ?? null) as string | null,
    valuationDate:    row['valuation_date'] ?? null,
    bank:             (row['bank'] ?? null) as string | null,
    apy:              toNumber(row['apy']),
    updatedAt:        row['updated_at'] ?? null,
  };
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
          bank, apy, custody, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18, NOW()
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
          input.bank ?? null,
          input.apy ?? null,
          input.custody ?? null,
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
          bank=$16, apy=$17, custody=$18, updated_at=NOW()
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
          input.bank ?? null,
          input.apy ?? null,
          input.custody ?? null,
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
