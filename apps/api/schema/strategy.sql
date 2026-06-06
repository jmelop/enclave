-- Enclave · módulo strategy · schema · idempotente
CREATE TABLE IF NOT EXISTS strategy_goals (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  hue         TEXT NOT NULL DEFAULT 'amber' CHECK (hue IN ('amber','blue','violet','teal','rose')),
  description TEXT NOT NULL DEFAULT '',
  north_star  BOOLEAN NOT NULL DEFAULT FALSE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','at-risk','blocked','done')),
  progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  metric      TEXT NOT NULL DEFAULT '',
  metric_unit TEXT NOT NULL DEFAULT '',
  metric_now  TEXT NOT NULL DEFAULT '',
  due         DATE,
  cadence     TEXT NOT NULL DEFAULT '',
  owner       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS strategy_plans (
  id         TEXT PRIMARY KEY,
  goal_id    TEXT NOT NULL REFERENCES strategy_goals(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  horizon    TEXT NOT NULL DEFAULT 'week' CHECK (horizon IN ('week','month')),
  done       BOOLEAN NOT NULL DEFAULT FALSE,
  due        DATE,
  position   INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS strategy_results (
  id       TEXT PRIMARY KEY,
  goal_id  TEXT NOT NULL REFERENCES strategy_goals(id) ON DELETE CASCADE,
  cadence  TEXT NOT NULL DEFAULT 'weekly' CHECK (cadence IN ('weekly','monthly')),
  period   TEXT NOT NULL,
  date     DATE NOT NULL,
  good     TEXT NOT NULL DEFAULT '',
  bad      TEXT NOT NULL DEFAULT '',
  change   TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS strategy_intel (
  id        TEXT PRIMARY KEY,
  goal_id   TEXT NOT NULL REFERENCES strategy_goals(id) ON DELETE CASCADE,
  type      TEXT NOT NULL CHECK (type IN ('note','result')),
  date      DATE NOT NULL,
  title     TEXT NOT NULL,
  body      TEXT,
  did       TEXT,
  expected  TEXT,
  happened  TEXT,
  verdict   TEXT CHECK (verdict IS NULL OR verdict IN ('win','loss'))
);
CREATE INDEX IF NOT EXISTS idx_strategy_plans_goal   ON strategy_plans(goal_id);
CREATE INDEX IF NOT EXISTS idx_strategy_results_goal ON strategy_results(goal_id);
CREATE INDEX IF NOT EXISTS idx_strategy_intel_goal   ON strategy_intel(goal_id);
