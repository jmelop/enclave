-- Enclave · módulo options · schema · idempotente

CREATE TABLE IF NOT EXISTS options_settings (
  key   TEXT  PRIMARY KEY,
  value JSONB NOT NULL
);
