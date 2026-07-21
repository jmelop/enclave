-- Enclave · módulo budget · schema · idempotente

CREATE TABLE IF NOT EXISTS budget_categories (
  id    TEXT    PRIMARY KEY,
  name  TEXT    NOT NULL,
  color TEXT    NOT NULL DEFAULT '#6b7280',
  icon  TEXT    NOT NULL DEFAULT 'package',
  sort  INTEGER NOT NULL DEFAULT 0
);

INSERT INTO budget_categories (id, name, color, icon, sort) VALUES
  ('food',          'Food & Dining', '#f59e0b', 'utensils', 0),
  ('transport',     'Transport',     '#3b82f6', 'car',      1),
  ('housing',       'Housing',       '#8b5cf6', 'home',     2),
  ('health',        'Health',        '#10b981', 'heart',    3),
  ('entertainment', 'Entertainment', '#f43f5e', 'film',     4),
  ('subscriptions', 'Subscriptions', '#14b8a6', 'repeat',   5),
  ('other',         'Other',         '#6b7280', 'package',  6)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS budget_category_targets (
  category TEXT          PRIMARY KEY,
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
  category  TEXT          NOT NULL,
  day       INTEGER       NOT NULL CHECK (day >= 1 AND day <= 31),
  variable  BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS budget_transactions (
  id                TEXT          PRIMARY KEY,
  date              DATE          NOT NULL,
  name              TEXT          NOT NULL,
  vendor            TEXT          NOT NULL DEFAULT '',
  amount            NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category          TEXT          NOT NULL,
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

-- Migration: category values used to be a fixed CHECK list; now they live in
-- budget_categories, so drop the old constraints on pre-existing databases.
ALTER TABLE budget_category_targets DROP CONSTRAINT IF EXISTS budget_category_targets_category_check;
ALTER TABLE budget_recurring        DROP CONSTRAINT IF EXISTS budget_recurring_category_check;
ALTER TABLE budget_transactions     DROP CONSTRAINT IF EXISTS budget_transactions_category_check;
