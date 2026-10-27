-- Enclave · módulo inventory · schema · idempotente

CREATE TABLE IF NOT EXISTS inventory_categories (
  id     TEXT    PRIMARY KEY,
  label  TEXT    NOT NULL,
  short  TEXT    NOT NULL,
  hue    INTEGER NOT NULL DEFAULT 260 CHECK (hue BETWEEN 0 AND 360),
  sort   INTEGER NOT NULL DEFAULT 0
);

INSERT INTO inventory_categories (id, label, short, hue, sort) VALUES
  ('pc',    'PC Components',    'PC',    220, 0),
  ('mcu',   'Microcontrollers', 'MCU',   160, 1),
  ('elec',  'Electronics',      'ELEC',  80,  2),
  ('tools', 'Tools',            'TOOLS', 300, 3),
  ('cable', 'Cables & Conn.',   'CABLE', 350, 4),
  ('other', 'Other',            'OTHER', 260, 5)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS inventory_items (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL,
  model       TEXT        NOT NULL DEFAULT '',
  qty         INTEGER     NOT NULL DEFAULT 0 CHECK (qty >= 0),
  location    TEXT        NOT NULL DEFAULT '',
  notes       TEXT        NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);

-- Migration: category values used to be a fixed CHECK list; now they live in
-- inventory_categories, so drop the old constraint on pre-existing databases.
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_category_check;
