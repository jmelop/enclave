-- Enclave · módulo workout · schema · idempotente
CREATE TABLE IF NOT EXISTS workout_sessions (
  id         TEXT PRIMARY KEY,
  date       DATE NOT NULL,
  name       TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS workout_exercises (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS workout_sets (
  id          TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  reps        INTEGER NOT NULL CHECK (reps >= 0),
  kg          NUMERIC(6,2) NOT NULL CHECK (kg >= 0)
);
CREATE TABLE IF NOT EXISTS workout_body_log (
  id      TEXT PRIMARY KEY,
  date    DATE NOT NULL UNIQUE,
  weight  NUMERIC(5,2) NOT NULL CHECK (weight > 0),
  waist   NUMERIC(5,2),
  chest   NUMERIC(5,2),
  hip     NUMERIC(5,2),
  bicep_l NUMERIC(5,2),
  bicep_r NUMERIC(5,2),
  thigh_l NUMERIC(5,2),
  thigh_r NUMERIC(5,2),
  notes   TEXT
);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session ON workout_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise     ON workout_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date     ON workout_sessions(date);
CREATE INDEX IF NOT EXISTS idx_workout_body_log_date     ON workout_body_log(date);
