-- Enclave · módulo portfolio · schema (b) idempotente
-- Orden importa: asset_categories antes que sus referenciadoras.

CREATE TABLE IF NOT EXISTS asset_categories (
  id       TEXT PRIMARY KEY,   -- 'stock'|'fund'|'crypto'|'savings'|'realestate'|'collectible'|'investment'
  label    TEXT NOT NULL,
  short    TEXT NOT NULL,
  color    TEXT NOT NULL,      -- hex
  pricing  TEXT NOT NULL       -- 'auto'|'manual'
);

INSERT INTO asset_categories (id, label, short, color, pricing) VALUES
  ('stock',       'Stocks',                'Stocks',                  '#5b9dff', 'auto'),
  ('fund',        'Funds',                 'Funds & ETFs',            '#5eead4', 'auto'),
  ('crypto',      'Crypto',                'Crypto',                  '#f7a23a', 'auto'),
  ('savings',     'Savings',               'Savings accounts',        '#86efac', 'manual'),
  ('realestate',  'Real Estate',           'Real Estate',             '#b08968', 'manual'),
  ('collectible', 'Metals & Collectibles', 'Collectibles',            '#d4a574', 'manual'),
  ('investment',  'Investments',           'Alternative investments', '#c4a3ff', 'manual')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS assets (
  id               TEXT PRIMARY KEY,
  type             TEXT NOT NULL REFERENCES asset_categories(id),
  name             TEXT NOT NULL,
  description      TEXT,
  currency         TEXT NOT NULL DEFAULT 'EUR',

  -- Mercado (stock, fund, crypto)
  symbol           TEXT,
  price            NUMERIC(18, 6),
  quantity         NUMERIC(18, 6),
  change_pct_24h   NUMERIC(8, 4),

  -- Solo funds
  isin             TEXT,
  ter              NUMERIC(6, 4),
  distribution     TEXT,        -- 'Acc'|'Dist'

  -- Manuales (savings, realestate, collectible, investment)
  amount           NUMERIC(18, 2),
  subtype          TEXT,        -- 'gold'|'startup'|'direct'|etc.
  valuation_date   DATE,

  -- Solo savings
  bank             TEXT,
  apy              NUMERIC(6, 4),

  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

CREATE TABLE IF NOT EXISTS allocation_targets (
  category    TEXT PRIMARY KEY REFERENCES asset_categories(id),
  target_pct  NUMERIC(5, 2) NOT NULL CHECK (target_pct >= 0 AND target_pct <= 100)
);

CREATE TABLE IF NOT EXISTS portfolio_meta (
  id         BOOLEAN PRIMARY KEY DEFAULT TRUE,  -- fuerza fila única
  last_sync  TIMESTAMPTZ,
  CONSTRAINT only_one_row CHECK (id = TRUE)
);
