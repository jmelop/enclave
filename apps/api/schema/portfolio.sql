-- Enclave · módulo portfolio · schema (b) idempotente
-- Orden importa: asset_categories antes que sus referenciadoras.

CREATE TABLE IF NOT EXISTS asset_categories (
  id  TEXT PRIMARY KEY   -- 'stock'|'fund'|'crypto'|'savings'|'realestate'|'collectible'|'investment'
);

CREATE TABLE IF NOT EXISTS portfolio_month_snapshots (
  month_key       TEXT PRIMARY KEY,  -- 'YYYY-MM'
  snapshot_date   DATE NOT NULL,
  total_value_eur NUMERIC(18, 2) NOT NULL CHECK (total_value_eur >= 0),
  asset_count     INTEGER NOT NULL DEFAULT 0 CHECK (asset_count >= 0),
  note            TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_month_snapshots_date
  ON portfolio_month_snapshots(snapshot_date);

INSERT INTO asset_categories (id) VALUES
  ('stock'), ('fund'), ('crypto'), ('savings'),
  ('realestate'), ('collectible'), ('investment')
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

  -- Dónde está el activo (broker, custody, banco, plataforma, seller…)
  institution      TEXT,

  -- Solo funds
  isin             TEXT,
  ter              NUMERIC(6, 4),
  distribution     TEXT,        -- 'Acc'|'Dist'

  -- Manuales (savings, realestate, collectible, investment)
  amount           NUMERIC(18, 2),
  subtype          TEXT,        -- 'gold'|'startup'|'direct'|etc.
  valuation_date   DATE,

  -- Solo savings
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
