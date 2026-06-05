import { Router } from 'express'
import { randomUUID } from 'crypto'
import type { DbPool, DbClient } from '@enclave/sdk'
import { SEED_IDEAS } from './seed'

const VALID_CATEGORIES = new Set(['dev', 'producto', 'research', 'infra', 'ia', 'diseno'])
const VALID_PHASES     = new Set(['spark', 'explore', 'proto', 'valid', 'archived'])
const VALID_LANGS      = new Set(['js', 'ts', 'py', 'sql', 'bash', 'json', 'css'])

type Row = Record<string, unknown>

interface SnippetBody {
  title?: string
  lang?: string
  code?: string
  desc?: string
  tags?: string[]
}

interface IdeaBody {
  title?: string
  category?: string
  phase?: string
  notes?: string
  links?: unknown[]
  snippets?: SnippetBody[]
}

function validateIdea(body: IdeaBody): string | null {
  if (!body.title?.trim()) return 'title is required'
  if (!VALID_CATEGORIES.has(body.category ?? '')) return 'invalid category'
  if (!VALID_PHASES.has(body.phase ?? '')) return 'invalid phase'
  return null
}

function mapSnippet(row: Row) {
  const desc = (row['description'] ?? '') as string
  return {
    id:    row['id']    as string,
    title: row['title'] as string,
    lang:  row['lang']  as string,
    code:  (row['code'] ?? '') as string,
    ...(desc ? { desc } : {}),
    tags:  (row['tags'] as string[] | null) ?? [],
  }
}

function mapIdea(row: Row, snippetRows: Row[]) {
  const updatedRaw = row['updated_at']
  return {
    id:       row['id']       as string,
    title:    row['title']    as string,
    category: row['category'] as string,
    phase:    row['phase']    as string,
    notes:    (row['notes'] ?? '') as string,
    links:    (row['links'] as unknown[]) ?? [],
    snippets: snippetRows.map(mapSnippet),
    updated:  updatedRaw
      ? new Date(updatedRaw as string).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  }
}

async function insertSnippets(
  client: DbClient,
  ideaId: string,
  snippets: SnippetBody[],
): Promise<void> {
  for (let i = 0; i < snippets.length; i++) {
    const s = snippets[i]
    if (!s) continue
    const lang = s.lang ?? 'ts'
    if (!VALID_LANGS.has(lang)) continue
    await client.query(
      `INSERT INTO idea_snippets (id, idea_id, position, title, lang, code, description, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        randomUUID(),
        ideaId,
        i,
        (s.title ?? '').trim(),
        lang,
        (s.code ?? '').trim(),
        (s.desc ?? '').trim(),
        s.tags ?? [],
      ],
    )
  }
}

export function createLabRouter(pool: DbPool): Router {
  const router = Router()

  // ── GET /ideas ──────────────────────────────────────────────────────────────
  // Returns all ideas with their snippets nested, ordered by updated_at DESC.
  // Falls back to seed data when DB is empty or unavailable.
  router.get('/ideas', async (_req, res) => {
    try {
      const { rows: ideaRows } = await pool.query(
        'SELECT * FROM lab_ideas ORDER BY updated_at DESC',
      )
      if (ideaRows.length === 0) return res.json(SEED_IDEAS)

      const ids = ideaRows.map(r => r['id'] as string)
      const { rows: snippetRows } = await pool.query(
        'SELECT * FROM idea_snippets WHERE idea_id = ANY($1) ORDER BY idea_id, position',
        [ids],
      )

      const snippetsByIdea = new Map<string, Row[]>()
      for (const sr of snippetRows) {
        const id = sr['idea_id'] as string
        const arr = snippetsByIdea.get(id) ?? []
        arr.push(sr)
        snippetsByIdea.set(id, arr)
      }

      return res.json(
        ideaRows.map(r => mapIdea(r, snippetsByIdea.get(r['id'] as string) ?? [])),
      )
    } catch (err) {
      console.warn('[lab] GET /ideas db unavailable, using seed:', err)
      return res.json(SEED_IDEAS)
    }
  })

  // ── GET /snippets ───────────────────────────────────────────────────────────
  // Cross-idea flat snippet list for SnippetsPage.
  // Each entry includes ideaId + ideaTitle so the page can link back to the idea.
  router.get('/snippets', async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT s.*, i.id AS idea_id, i.title AS idea_title
         FROM idea_snippets s
         JOIN lab_ideas i ON i.id = s.idea_id
         ORDER BY i.updated_at DESC, s.position`,
      )
      return res.json(
        rows.map(r => ({
          ...mapSnippet(r),
          ideaId:    r['idea_id']    as string,
          ideaTitle: r['idea_title'] as string,
        })),
      )
    } catch (err) {
      console.warn('[lab] GET /snippets db unavailable, using seed:', err)
      const flat = SEED_IDEAS.flatMap(idea =>
        idea.snippets.map(snip => ({ ...snip, ideaId: idea.id, ideaTitle: idea.title })),
      )
      return res.json(flat)
    }
  })

  // ── POST /ideas ─────────────────────────────────────────────────────────────
  // Creates idea + snippets atomically. IDs are always generated server-side.
  router.post('/ideas', async (req, res) => {
    const body = req.body as IdeaBody
    const validationError = validateIdea(body)
    if (validationError) return res.status(400).json({ error: validationError })

    const id = randomUUID()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO lab_ideas (id, title, category, phase, notes, links, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [id, body.title!.trim(), body.category, body.phase, body.notes ?? '', JSON.stringify(body.links ?? [])],
      )
      await insertSnippets(client, id, body.snippets ?? [])
      await client.query('COMMIT')
    } catch (e) {
      try { await client.query('ROLLBACK') } catch { /* swallow: connection already gone */ }
      console.warn('[lab] POST /ideas db error:', e)
      return res.status(503).json({ error: 'Database unavailable, cannot create idea' })
    } finally {
      client.release()
    }

    const { rows: [ideaRow] } = await pool.query('SELECT * FROM lab_ideas WHERE id = $1', [id])
    const { rows: snipRows  } = await pool.query(
      'SELECT * FROM idea_snippets WHERE idea_id = $1 ORDER BY position',
      [id],
    )
    return res.status(201).json(mapIdea(ideaRow, snipRows))
  })

  // ── PUT /ideas/:id ──────────────────────────────────────────────────────────
  // Whole-idea update + whole-array snippet reconciliation in a single transaction.
  router.put('/ideas/:id', async (req, res) => {
    const { id } = req.params
    const body = req.body as IdeaBody
    const validationError = validateIdea(body)
    if (validationError) return res.status(400).json({ error: validationError })

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        `UPDATE lab_ideas
         SET title=$2, category=$3, phase=$4, notes=$5, links=$6, updated_at=NOW()
         WHERE id=$1
         RETURNING id`,
        [id, body.title!.trim(), body.category, body.phase, body.notes ?? '', JSON.stringify(body.links ?? [])],
      )
      if (rows.length === 0) {
        throw Object.assign(new Error('not found'), { notFound: true })
      }
      await client.query('DELETE FROM idea_snippets WHERE idea_id = $1', [id])
      await insertSnippets(client, id, body.snippets ?? [])
      await client.query('COMMIT')
    } catch (e) {
      try { await client.query('ROLLBACK') } catch { /* swallow: connection already gone */ }
      if ((e as { notFound?: boolean }).notFound) {
        return res.status(404).json({ error: 'Idea not found' })
      }
      console.warn('[lab] PUT /ideas/:id db error:', e)
      return res.status(503).json({ error: 'Database unavailable, cannot update idea' })
    } finally {
      client.release()
    }

    const { rows: [ideaRow] } = await pool.query('SELECT * FROM lab_ideas WHERE id = $1', [id])
    const { rows: snipRows  } = await pool.query(
      'SELECT * FROM idea_snippets WHERE idea_id = $1 ORDER BY position',
      [id],
    )
    return res.status(200).json(mapIdea(ideaRow, snipRows))
  })

  // ── DELETE /ideas/:id ───────────────────────────────────────────────────────
  // Idempotent 204. Snippets cascade via FK. Seed IDs that don't exist in DB
  // are silently ignored, matching the inventory/portfolio pattern.
  router.delete('/ideas/:id', async (req, res) => {
    const { id } = req.params
    try {
      await pool.query('DELETE FROM lab_ideas WHERE id = $1', [id])
      return res.status(204).end()
    } catch (err) {
      console.warn('[lab] DELETE /ideas/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot delete idea' })
    }
  })

  return router
}
