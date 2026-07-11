-- Enclave · módulo budget · schema · idempotente

CREATE TABLE IF NOT EXISTS budget_category_targets (
  category TEXT          PRIMARY KEY
    CHECK (category IN ('food','transport','housing','health','entertainment','subscriptions','other')),
  amount   NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount >= 0)
);

INSERT INTO budget_category_targets (category, amount) VALUES
  ('food',800),('transport',300),('housing',1500),
  ('health',200),('entertainment',150),('subscriptions',100),('other',200)
ON CONFLICT (category) DO NOTHING;

CREATE TABLE IF NOT EXISTS budget_months (
  month_key TEXT          PRIMARY KEY,  -- 'YYYY-MM'
  income    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (income >= 0),
  note      TEXT          NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS budget_recurring (
  id        TEXT          PRIMARY KEY,
  name      TEXT          NOT NULL,
  vendor    TEXT          NOT NULL DEFAULT '',
  amount    NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category  TEXT          NOT NULL
    CHECK (category IN ('food','transport','housing','health','entertainment','subscriptions','other')),
  day       INTEGER       NOT NULL CHECK (day >= 1 AND day <= 31),
  variable  BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS budget_transactions (
  id                TEXT          PRIMARY KEY,
  date              DATE          NOT NULL,
  name              TEXT          NOT NULL,
  vendor            TEXT          NOT NULL DEFAULT '',
  amount            NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category          TEXT          NOT NULL
    CHECK (category IN ('food','transport','housing','health','entertainment','subscriptions','other')),
  source            TEXT          NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','recurring')),
  recurring_bill_id TEXT
    REFERENCES budget_recurring(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS budget_incomes (
  id     TEXT          PRIMARY KEY,
  date   DATE          NOT NULL,
  name   TEXT          NOT NULL,
  source TEXT          NOT NULL DEFAULT '',
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_budget_income_date  ON budget_incomes(date);
CREATE INDEX IF NOT EXISTS idx_budget_tx_date      ON budget_transactions(date);
CREATE INDEX IF NOT EXISTS idx_budget_tx_category  ON budget_transactions(category);
CREATE INDEX IF NOT EXISTS idx_budget_tx_source    ON budget_transactions(source);
CREATE INDEX IF NOT EXISTS idx_budget_rec_category ON budget_recurring(category);
