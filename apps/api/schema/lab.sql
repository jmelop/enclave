-- Enclave · módulo lab · schema · idempotente

CREATE TABLE IF NOT EXISTS lab_ideas (
  id          TEXT        PRIMARY KEY,
  title       TEXT        NOT NULL,
  category    TEXT        NOT NULL CHECK (category IN ('dev','producto','research','infra','ia','diseno')),
  phase       TEXT        NOT NULL CHECK (phase IN ('spark','explore','proto','valid','archived')),
  notes       TEXT        NOT NULL DEFAULT '',
  links       JSONB       NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idea_snippets (
  id          TEXT     PRIMARY KEY,
  idea_id     TEXT     NOT NULL REFERENCES lab_ideas(id) ON DELETE CASCADE,
  position    INTEGER  NOT NULL DEFAULT 0,
  title       TEXT     NOT NULL,
  lang        TEXT     NOT NULL CHECK (lang IN ('js','ts','py','sql','bash','json','css')),
  code        TEXT     NOT NULL DEFAULT '',
  description TEXT     NOT NULL DEFAULT '',
  tags        TEXT[]   NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_lab_ideas_phase      ON lab_ideas(phase);
CREATE INDEX IF NOT EXISTS idx_lab_ideas_category   ON lab_ideas(category);
CREATE INDEX IF NOT EXISTS idx_idea_snippets_idea   ON idea_snippets(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_snippets_lang   ON idea_snippets(lang);
