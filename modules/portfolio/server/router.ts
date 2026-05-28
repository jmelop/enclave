import { Router } from 'express';
import type { DbPool } from '@enclave/sdk';
import { INITIAL_ASSETS } from './seed';

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

  return router;
}
