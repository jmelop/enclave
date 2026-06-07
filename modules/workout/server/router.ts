import { Router } from 'express'
import { randomUUID } from 'crypto'
import type { DbPool, DbClient } from '@enclave/sdk'
import { SEED_SESSIONS, SEED_BODY_LOG } from './seed'

type Row = Record<string, unknown>

interface SetBody {
  reps?: number
  kg?: number
}
interface ExerciseBody {
  name?: string
  sets?: SetBody[]
}
interface SessionBody {
  date?: string
  name?: string
  exercises?: ExerciseBody[]
}
interface BodyEntryBody {
  date?: string
  weight?: number
  waist?: number
  chest?: number
  hip?: number
  bicepL?: number
  bicepR?: number
  thighL?: number
  thighR?: number
  notes?: string
}

function dateStrOf(raw: unknown): string {
  return raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10)
}

function numOrUndef(v: unknown): number | undefined {
  return v === null || v === undefined ? undefined : Number(v)
}

// ── Row mappers ───────────────────────────────────────────────────────────────

function mapSet(row: Row) {
  return {
    reps: Number(row['reps']),
    kg: Number(row['kg']),
  }
}

function mapExercise(row: Row, setRows: Row[]) {
  return {
    name: row['name'] as string,
    sets: setRows.map(mapSet),
  }
}

function mapSession(row: Row, exerciseRows: Row[], setsByExercise: Map<string, Row[]>) {
  return {
    id: row['id'] as string,
    date: dateStrOf(row['date']),
    name: row['name'] as string,
    exercises: exerciseRows.map(er =>
      mapExercise(er, setsByExercise.get(er['id'] as string) ?? []),
    ),
  }
}

function mapBodyEntry(row: Row) {
  return {
    id: row['id'] as string,
    date: dateStrOf(row['date']),
    weight: Number(row['weight']),
    waist: numOrUndef(row['waist']),
    chest: numOrUndef(row['chest']),
    hip: numOrUndef(row['hip']),
    bicepL: numOrUndef(row['bicep_l']),
    bicepR: numOrUndef(row['bicep_r']),
    thighL: numOrUndef(row['thigh_l']),
    thighR: numOrUndef(row['thigh_r']),
    notes: (row['notes'] ?? undefined) as string | undefined,
  }
}

// ── Nested write helper ───────────────────────────────────────────────────────
// Inserts exercises (and their sets) for a session, preserving array order as position.

async function insertExercises(
  client: DbClient,
  sessionId: string,
  exercises: ExerciseBody[],
): Promise<void> {
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    if (!ex) continue
    const exerciseId = randomUUID()
    await client.query(
      `INSERT INTO workout_exercises (id, session_id, name, position) VALUES ($1, $2, $3, $4)`,
      [exerciseId, sessionId, (ex.name ?? '').trim(), i],
    )
    const sets = ex.sets ?? []
    for (let j = 0; j < sets.length; j++) {
      const s = sets[j]
      if (!s) continue
      await client.query(
        `INSERT INTO workout_sets (id, exercise_id, position, reps, kg) VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), exerciseId, j, Number(s.reps) || 0, Number(s.kg) || 0],
      )
    }
  }
}

// Re-loads a session with its exercises/sets nested, for POST/PUT responses.
async function loadSession(pool: DbPool, id: string) {
  const { rows: [sessionRow] } = await pool.query('SELECT * FROM workout_sessions WHERE id = $1', [id])
  const { rows: exerciseRows } = await pool.query(
    'SELECT * FROM workout_exercises WHERE session_id = $1 ORDER BY position',
    [id],
  )
  const exerciseIds = exerciseRows.map(r => r['id'] as string)
  const { rows: setRows } = await pool.query(
    'SELECT * FROM workout_sets WHERE exercise_id = ANY($1) ORDER BY exercise_id, position',
    [exerciseIds],
  )
  const setsByExercise = new Map<string, Row[]>()
  for (const sr of setRows) {
    const exId = sr['exercise_id'] as string
    const arr = setsByExercise.get(exId) ?? []
    arr.push(sr)
    setsByExercise.set(exId, arr)
  }
  return mapSession(sessionRow, exerciseRows, setsByExercise)
}

export function createWorkoutRouter(pool: DbPool): Router {
  const router = Router()

  // ── GET /sessions ────────────────────────────────────────────────────────
  // Sessions newest first, with exercises→sets nested via batched grouped queries.
  // Falls back to seed data when DB is empty or unavailable.
  router.get('/sessions', async (_req, res) => {
    try {
      const { rows: sessionRows } = await pool.query(
        'SELECT * FROM workout_sessions ORDER BY date DESC',
      )
      if (sessionRows.length === 0) return res.json(SEED_SESSIONS)

      const sessionIds = sessionRows.map(r => r['id'] as string)
      const { rows: exerciseRows } = await pool.query(
        'SELECT * FROM workout_exercises WHERE session_id = ANY($1) ORDER BY session_id, position',
        [sessionIds],
      )
      const exerciseIds = exerciseRows.map(r => r['id'] as string)
      const { rows: setRows } = await pool.query(
        'SELECT * FROM workout_sets WHERE exercise_id = ANY($1) ORDER BY exercise_id, position',
        [exerciseIds],
      )

      const setsByExercise = new Map<string, Row[]>()
      for (const sr of setRows) {
        const exId = sr['exercise_id'] as string
        const arr = setsByExercise.get(exId) ?? []
        arr.push(sr)
        setsByExercise.set(exId, arr)
      }
      const exercisesBySession = new Map<string, Row[]>()
      for (const er of exerciseRows) {
        const sessId = er['session_id'] as string
        const arr = exercisesBySession.get(sessId) ?? []
        arr.push(er)
        exercisesBySession.set(sessId, arr)
      }

      return res.json(
        sessionRows.map(r =>
          mapSession(r, exercisesBySession.get(r['id'] as string) ?? [], setsByExercise),
        ),
      )
    } catch (err) {
      console.warn('[workout] GET /sessions db unavailable, using seed:', err)
      return res.json(SEED_SESSIONS)
    }
  })

  // ── POST /sessions ───────────────────────────────────────────────────────
  // Creates session + exercises + sets atomically. IDs are always server-generated.
  router.post('/sessions', async (req, res) => {
    const body = req.body as SessionBody
    if (!body.date) return res.status(400).json({ error: 'date is required' })
    if (!body.name?.trim()) return res.status(400).json({ error: 'name is required' })

    const id = randomUUID()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO workout_sessions (id, date, name, updated_at) VALUES ($1, $2, $3, NOW())`,
        [id, body.date, body.name.trim()],
      )
      await insertExercises(client, id, body.exercises ?? [])
      await client.query('COMMIT')
    } catch (e) {
      try { await client.query('ROLLBACK') } catch { /* swallow: connection already gone */ }
      console.warn('[workout] POST /sessions db error:', e)
      return res.status(503).json({ error: 'Database unavailable, cannot create session' })
    } finally {
      client.release()
    }

    return res.status(201).json(await loadSession(pool, id))
  })

  // ── PUT /sessions/:id ────────────────────────────────────────────────────
  // Updates the session and reconciles exercises+sets via whole-array replace.
  router.put('/sessions/:id', async (req, res) => {
    const { id } = req.params
    const body = req.body as SessionBody
    if (!body.date) return res.status(400).json({ error: 'date is required' })
    if (!body.name?.trim()) return res.status(400).json({ error: 'name is required' })

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        `UPDATE workout_sessions SET date=$2, name=$3, updated_at=NOW() WHERE id=$1 RETURNING id`,
        [id, body.date, body.name.trim()],
      )
      if (rows.length === 0) {
        throw Object.assign(new Error('not found'), { notFound: true })
      }
      await client.query('DELETE FROM workout_exercises WHERE session_id = $1', [id])
      await insertExercises(client, id, body.exercises ?? [])
      await client.query('COMMIT')
    } catch (e) {
      try { await client.query('ROLLBACK') } catch { /* swallow: connection already gone */ }
      if ((e as { notFound?: boolean }).notFound) {
        return res.status(404).json({ error: 'Session not found' })
      }
      console.warn('[workout] PUT /sessions/:id db error:', e)
      return res.status(503).json({ error: 'Database unavailable, cannot update session' })
    } finally {
      client.release()
    }

    return res.status(200).json(await loadSession(pool, id))
  })

  // ── DELETE /sessions/:id ─────────────────────────────────────────────────
  // Idempotent 204. Exercises/sets cascade via FK.
  router.delete('/sessions/:id', async (req, res) => {
    const { id } = req.params
    try {
      await pool.query('DELETE FROM workout_sessions WHERE id = $1', [id])
      return res.status(204).end()
    } catch (err) {
      console.warn('[workout] DELETE /sessions/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot delete session' })
    }
  })

  // ── GET /body ────────────────────────────────────────────────────────────
  router.get('/body', async (_req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM workout_body_log ORDER BY date')
      if (rows.length === 0) return res.json(SEED_BODY_LOG)
      return res.json(rows.map(mapBodyEntry))
    } catch (err) {
      console.warn('[workout] GET /body db unavailable, using seed:', err)
      return res.json(SEED_BODY_LOG)
    }
  })

  // ── POST /body ───────────────────────────────────────────────────────────
  // date is UNIQUE — upsert so logging the same day again updates the entry.
  router.post('/body', async (req, res) => {
    const body = req.body as BodyEntryBody
    if (!body.date) return res.status(400).json({ error: 'date is required' })
    if (!(Number(body.weight) > 0)) return res.status(400).json({ error: 'weight must be greater than 0' })

    try {
      const { rows: [row] } = await pool.query(
        `INSERT INTO workout_body_log (id, date, weight, waist, chest, hip, bicep_l, bicep_r, thigh_l, thigh_r, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (date) DO UPDATE
           SET weight=EXCLUDED.weight, waist=EXCLUDED.waist, chest=EXCLUDED.chest, hip=EXCLUDED.hip,
               bicep_l=EXCLUDED.bicep_l, bicep_r=EXCLUDED.bicep_r, thigh_l=EXCLUDED.thigh_l, thigh_r=EXCLUDED.thigh_r,
               notes=EXCLUDED.notes
         RETURNING *`,
        [
          randomUUID(), body.date, body.weight,
          body.waist ?? null, body.chest ?? null, body.hip ?? null,
          body.bicepL ?? null, body.bicepR ?? null, body.thighL ?? null, body.thighR ?? null,
          body.notes?.trim() || null,
        ],
      )
      return res.status(201).json(mapBodyEntry(row))
    } catch (err) {
      console.warn('[workout] POST /body db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot create body entry' })
    }
  })

  // ── PUT /body/:id ────────────────────────────────────────────────────────
  router.put('/body/:id', async (req, res) => {
    const { id } = req.params
    const body = req.body as BodyEntryBody
    if (!body.date) return res.status(400).json({ error: 'date is required' })
    if (!(Number(body.weight) > 0)) return res.status(400).json({ error: 'weight must be greater than 0' })

    try {
      const { rows } = await pool.query(
        `UPDATE workout_body_log
         SET date=$2, weight=$3, waist=$4, chest=$5, hip=$6, bicep_l=$7, bicep_r=$8, thigh_l=$9, thigh_r=$10, notes=$11
         WHERE id=$1
         RETURNING *`,
        [
          id, body.date, body.weight,
          body.waist ?? null, body.chest ?? null, body.hip ?? null,
          body.bicepL ?? null, body.bicepR ?? null, body.thighL ?? null, body.thighR ?? null,
          body.notes?.trim() || null,
        ],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Body entry not found' })
      return res.status(200).json(mapBodyEntry(rows[0]))
    } catch (err) {
      console.warn('[workout] PUT /body/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot update body entry' })
    }
  })

  // ── DELETE /body/:id ─────────────────────────────────────────────────────
  // Idempotent 204.
  router.delete('/body/:id', async (req, res) => {
    const { id } = req.params
    try {
      await pool.query('DELETE FROM workout_body_log WHERE id = $1', [id])
      return res.status(204).end()
    } catch (err) {
      console.warn('[workout] DELETE /body/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot delete body entry' })
    }
  })

  return router
}
