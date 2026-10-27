-- Enclave · módulo stock · schema · idempotente

CREATE TABLE IF NOT EXISTS stock_products (
  id           TEXT          PRIMARY KEY,
  name         TEXT          NOT NULL,
  quantity     INTEGER       NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_cost    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  sale_price   NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  platforms    TEXT,
  sales_count  INTEGER       NOT NULL DEFAULT 0 CHECK (sales_count >= 0),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_products_created_at ON stock_products(created_at);
