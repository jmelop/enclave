-- Enclave · módulo inventory · schema · idempotente

CREATE TABLE IF NOT EXISTS inventory_items (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL CHECK (category IN ('pc','mcu','elec','tools','cable','other')),
  model       TEXT        NOT NULL DEFAULT '',
  qty         INTEGER     NOT NULL DEFAULT 0 CHECK (qty >= 0),
  location    TEXT        NOT NULL DEFAULT '',
  notes       TEXT        NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
