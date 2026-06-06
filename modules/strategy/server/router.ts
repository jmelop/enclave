import { Router } from 'express'
import { randomUUID } from 'crypto'
import type { DbPool, DbClient } from '@enclave/sdk'
import { SEED_GOALS, SEED_PLANS, SEED_RESULTS, SEED_INTEL } from './seed'

const VALID_HUES     = new Set(['amber', 'blue', 'violet', 'teal', 'rose'])
const VALID_STATUSES = new Set(['active', 'at-risk', 'blocked', 'done'])
const VALID_HORIZONS = new Set(['week', 'month'])
const VALID_CADENCES = new Set(['weekly', 'monthly'])
const VALID_TYPES    = new Set(['note', 'result'])
const VALID_VERDICTS = new Set(['win', 'loss'])

type Row = Record<string, unknown>

// ── Date helper ───────────────────────────────────────────────────────────────

function dateStr(val: unknown): string {
  if (!val) return ''
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  return String(val).slice(0, 10)
}

// ── Row mappers (snake_case DB → camelCase API) ───────────────────────────────

function mapGoal(row: Row) {
  return {
    id:         row['id']          as string,
    name:       row['name']        as string,
    hue:        row['hue']         as string,
    desc:       (row['description'] ?? '') as string,
    northStar:  Boolean(row['north_star']),
    status:     row['status']      as string,
    progress:   Number(row['progress']),
    metric:     (row['metric']     ?? '') as string,
    metricUnit: (row['metric_unit'] ?? '') as string,
    metricNow:  (row['metric_now'] ?? '') as string,
    due:        dateStr(row['due']),
    cadence:    (row['cadence']    ?? '') as string,
    owner:      (row['owner']      ?? '') as string,
  }
}

function mapPlan(row: Row) {
  return {
    id:      row['id']      as string,
    goal:    row['goal_id'] as string,   // goal_id → goal (matches client type)
    title:   row['title']  as string,
    horizon: row['horizon'] as string,
    done:    Boolean(row['done']),
    due:     dateStr(row['due']),
  }
}

function mapResult(row: Row) {
  return {
    id:      row['id']      as string,
    goal:    row['goal_id'] as string,   // goal_id → goal
    cadence: row['cadence'] as string,
    period:  row['period']  as string,
    date:    dateStr(row['date']),
    good:    (row['good']   ?? '') as string,
    bad:     (row['bad']    ?? '') as string,
    change:  (row['change'] ?? '') as string,
  }
}

function mapIntel(row: Row) {
  return {
    id:       row['id']       as string,
    type:     row['type']     as string,
    goal:     row['goal_id']  as string,   // goal_id → goal
    date:     dateStr(row['date']),
    title:    row['title']    as string,
    body:     (row['body']     ?? undefined) as string | undefined,
    did:      (row['did']      ?? undefined) as string | undefined,
    expected: (row['expected'] ?? undefined) as string | undefined,
    happened: (row['happened'] ?? undefined) as string | undefined,
    verdict:  (row['verdict']  ?? undefined) as string | undefined,
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export function createStrategyRouter(pool: DbPool): Router {
  const router = Router()

  // ══════════════════════════════════════════════════════════════════════════
  // GOALS
  // ══════════════════════════════════════════════════════════════════════════

  router.get('/goals', async (_req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM strategy_goals ORDER BY updated_at DESC',
      )
      return res.json(rows.length > 0 ? rows.map(mapGoal) : SEED_GOALS)
    } catch (err) {
      console.warn('[strategy] GET /goals db error:', err)
      return res.json(SEED_GOALS)
    }
  })

  router.post('/goals', async (req, res) => {
    const b = req.body as {
      name?: string; hue?: string; desc?: string; northStar?: boolean
      status?: string; progress?: number; metric?: string
      metricUnit?: string; metricNow?: string; due?: string
      cadence?: string; owner?: string
    }
    if (!b.name?.trim())                return res.status(400).json({ error: 'name is required' })
    if (!VALID_HUES.has(b.hue ?? ''))   return res.status(400).json({ error: 'invalid hue' })
    if (!VALID_STATUSES.has(b.status ?? '')) return res.status(400).json({ error: 'invalid status' })

    const id = randomUUID()
    try {
      const { rows } = await pool.query(
        `INSERT INTO strategy_goals
           (id, name, hue, description, north_star, status, progress,
            metric, metric_unit, metric_now, due, cadence, owner, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
         RETURNING *`,
        [
          id, b.name.trim(), b.hue, b.desc ?? '',
          b.northStar ?? false, b.status, b.progress ?? 0,
          b.metric ?? '', b.metricUnit ?? '', b.metricNow ?? '',
          b.due || null, b.cadence ?? '', b.owner ?? '',
        ],
      )
      return res.status(201).json(mapGoal(rows[0]))
    } catch (err) {
      console.warn('[strategy] POST /goals db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  router.put('/goals/:id', async (req, res) => {
    const { id } = req.params
    const b = req.body as {
      name?: string; hue?: string; desc?: string; northStar?: boolean
      status?: string; progress?: number; metric?: string
      metricUnit?: string; metricNow?: string; due?: string
      cadence?: string; owner?: string
    }
    if (!b.name?.trim())                return res.status(400).json({ error: 'name is required' })
    if (!VALID_HUES.has(b.hue ?? ''))   return res.status(400).json({ error: 'invalid hue' })
    if (!VALID_STATUSES.has(b.status ?? '')) return res.status(400).json({ error: 'invalid status' })

    try {
      const { rows } = await pool.query(
        `UPDATE strategy_goals
         SET name=$2, hue=$3, description=$4, north_star=$5, status=$6,
             progress=$7, metric=$8, metric_unit=$9, metric_now=$10,
             due=$11, cadence=$12, owner=$13, updated_at=NOW()
         WHERE id=$1
         RETURNING *`,
        [
          id, b.name.trim(), b.hue, b.desc ?? '',
          b.northStar ?? false, b.status, b.progress ?? 0,
          b.metric ?? '', b.metricUnit ?? '', b.metricNow ?? '',
          b.due || null, b.cadence ?? '', b.owner ?? '',
        ],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Goal not found' })
      return res.status(200).json(mapGoal(rows[0]))
    } catch (err) {
      console.warn('[strategy] PUT /goals/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  router.delete('/goals/:id', async (req, res) => {
    const { id } = req.params
    try {
      await pool.query('DELETE FROM strategy_goals WHERE id = $1', [id])
      return res.status(204).end()
    } catch (err) {
      console.warn('[strategy] DELETE /goals/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  // ══════════════════════════════════════════════════════════════════════════
  // PLANS
  // ══════════════════════════════════════════════════════════════════════════

  router.get('/plans', async (_req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM strategy_plans ORDER BY goal_id, position',
      )
      return res.json(rows.length > 0 ? rows.map(mapPlan) : SEED_PLANS)
    } catch (err) {
      console.warn('[strategy] GET /plans db error:', err)
      return res.json(SEED_PLANS)
    }
  })

  router.post('/plans', async (req, res) => {
    const b = req.body as {
      goal?: string; title?: string; horizon?: string
      done?: boolean; due?: string
    }
    if (!b.title?.trim())                   return res.status(400).json({ error: 'title is required' })
    if (!b.goal?.trim())                    return res.status(400).json({ error: 'goal is required' })
    if (!VALID_HORIZONS.has(b.horizon ?? '')) return res.status(400).json({ error: 'invalid horizon' })

    const id = randomUUID()
    try {
      // Check goal exists
      const { rows: goalRows } = await pool.query(
        'SELECT id FROM strategy_goals WHERE id = $1', [b.goal],
      )
      if (goalRows.length === 0) return res.status(400).json({ error: 'goal not found' })

      // position = max + 1 for this goal
      const { rows: posRows } = await pool.query(
        'SELECT COALESCE(MAX(position), -1) AS max_pos FROM strategy_plans WHERE goal_id = $1',
        [b.goal],
      )
      const position = Number(posRows[0]!['max_pos']) + 1

      const { rows } = await pool.query(
        `INSERT INTO strategy_plans (id, goal_id, title, horizon, done, due, position)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [id, b.goal, b.title.trim(), b.horizon, b.done ?? false, b.due || null, position],
      )
      return res.status(201).json(mapPlan(rows[0]))
    } catch (err) {
      console.warn('[strategy] POST /plans db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  // PATCH /plans/reorder MUST be registered before PATCH /plans/:id/toggle
  // to avoid 'reorder' being matched as an :id value.
  router.patch('/plans/reorder', async (req, res) => {
    const b = req.body as { goalId?: string; orderedIds?: string[] }
    if (!b.goalId || !Array.isArray(b.orderedIds)) {
      return res.status(400).json({ error: 'goalId and orderedIds[] are required' })
    }
    const client: DbClient = await pool.connect()
    try {
      await client.query('BEGIN')
      for (let i = 0; i < b.orderedIds.length; i++) {
        await client.query(
          'UPDATE strategy_plans SET position = $1 WHERE id = $2 AND goal_id = $3',
          [i, b.orderedIds[i]!, b.goalId],
        )
      }
      await client.query('COMMIT')
      return res.status(200).json({ ok: true })
    } catch (err) {
      try { await client.query('ROLLBACK') } catch { /* swallow */ }
      console.warn('[strategy] PATCH /plans/reorder db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    } finally {
      client.release()
    }
  })

  router.patch('/plans/:id/toggle', async (req, res) => {
    const { id } = req.params
    try {
      const { rows } = await pool.query(
        'UPDATE strategy_plans SET done = NOT done WHERE id = $1 RETURNING *',
        [id],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Plan not found' })
      return res.status(200).json(mapPlan(rows[0]))
    } catch (err) {
      console.warn('[strategy] PATCH /plans/:id/toggle db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  router.put('/plans/:id', async (req, res) => {
    const { id } = req.params
    const b = req.body as {
      title?: string; horizon?: string; done?: boolean; due?: string
    }
    if (!b.title?.trim())                   return res.status(400).json({ error: 'title is required' })
    if (!VALID_HORIZONS.has(b.horizon ?? '')) return res.status(400).json({ error: 'invalid horizon' })

    try {
      const { rows } = await pool.query(
        `UPDATE strategy_plans
         SET title=$2, horizon=$3, done=$4, due=$5
         WHERE id=$1
         RETURNING *`,
        [id, b.title.trim(), b.horizon, b.done ?? false, b.due || null],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Plan not found' })
      return res.status(200).json(mapPlan(rows[0]))
    } catch (err) {
      console.warn('[strategy] PUT /plans/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  router.delete('/plans/:id', async (req, res) => {
    const { id } = req.params
    try {
      await pool.query('DELETE FROM strategy_plans WHERE id = $1', [id])
      return res.status(204).end()
    } catch (err) {
      console.warn('[strategy] DELETE /plans/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTS
  // ══════════════════════════════════════════════════════════════════════════

  router.get('/results', async (_req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM strategy_results ORDER BY date DESC',
      )
      return res.json(rows.length > 0 ? rows.map(mapResult) : SEED_RESULTS)
    } catch (err) {
      console.warn('[strategy] GET /results db error:', err)
      return res.json(SEED_RESULTS)
    }
  })

  router.post('/results', async (req, res) => {
    const b = req.body as {
      goal?: string; cadence?: string; period?: string
      date?: string; good?: string; bad?: string; change?: string
    }
    if (!b.goal?.trim())                    return res.status(400).json({ error: 'goal is required' })
    if (!b.period?.trim())                  return res.status(400).json({ error: 'period is required' })
    if (!VALID_CADENCES.has(b.cadence ?? '')) return res.status(400).json({ error: 'invalid cadence' })

    const id = randomUUID()
    const date = b.date || new Date().toISOString().slice(0, 10)
    try {
      const { rows } = await pool.query(
        `INSERT INTO strategy_results (id, goal_id, cadence, period, date, good, bad, change)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [id, b.goal, b.cadence, b.period.trim(), date, b.good ?? '', b.bad ?? '', b.change ?? ''],
      )
      return res.status(201).json(mapResult(rows[0]))
    } catch (err) {
      console.warn('[strategy] POST /results db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  router.put('/results/:id', async (req, res) => {
    const { id } = req.params
    const b = req.body as {
      cadence?: string; period?: string; date?: string
      good?: string; bad?: string; change?: string
    }
    if (!b.period?.trim())                  return res.status(400).json({ error: 'period is required' })
    if (!VALID_CADENCES.has(b.cadence ?? '')) return res.status(400).json({ error: 'invalid cadence' })

    const date = b.date || new Date().toISOString().slice(0, 10)
    try {
      const { rows } = await pool.query(
        `UPDATE strategy_results
         SET cadence=$2, period=$3, date=$4, good=$5, bad=$6, change=$7
         WHERE id=$1
         RETURNING *`,
        [id, b.cadence, b.period.trim(), date, b.good ?? '', b.bad ?? '', b.change ?? ''],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Result not found' })
      return res.status(200).json(mapResult(rows[0]))
    } catch (err) {
      console.warn('[strategy] PUT /results/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  router.delete('/results/:id', async (req, res) => {
    const { id } = req.params
    try {
      await pool.query('DELETE FROM strategy_results WHERE id = $1', [id])
      return res.status(204).end()
    } catch (err) {
      console.warn('[strategy] DELETE /results/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  // ══════════════════════════════════════════════════════════════════════════
  // INTEL
  // ══════════════════════════════════════════════════════════════════════════

  router.get('/intel', async (_req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM strategy_intel ORDER BY date DESC',
      )
      return res.json(rows.length > 0 ? rows.map(mapIntel) : SEED_INTEL)
    } catch (err) {
      console.warn('[strategy] GET /intel db error:', err)
      return res.json(SEED_INTEL)
    }
  })

  router.post('/intel', async (req, res) => {
    const b = req.body as {
      type?: string; goal?: string; date?: string; title?: string
      body?: string; did?: string; expected?: string; happened?: string; verdict?: string
    }
    if (!VALID_TYPES.has(b.type ?? ''))   return res.status(400).json({ error: 'invalid type' })
    if (!b.goal?.trim())                  return res.status(400).json({ error: 'goal is required' })
    if (!b.title?.trim())                 return res.status(400).json({ error: 'title is required' })
    if (b.type === 'note' && !b.body?.trim()) return res.status(400).json({ error: 'body is required for note' })
    if (b.type === 'result') {
      if (!b.did?.trim())      return res.status(400).json({ error: 'did is required for result' })
      if (!b.expected?.trim()) return res.status(400).json({ error: 'expected is required for result' })
      if (!b.happened?.trim()) return res.status(400).json({ error: 'happened is required for result' })
      if (!VALID_VERDICTS.has(b.verdict ?? '')) return res.status(400).json({ error: 'verdict must be win or loss' })
    }

    const id = randomUUID()
    const date = b.date || new Date().toISOString().slice(0, 10)
    try {
      const { rows } = await pool.query(
        `INSERT INTO strategy_intel
           (id, goal_id, type, date, title, body, did, expected, happened, verdict)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          id, b.goal, b.type, date, b.title.trim(),
          b.type === 'note' ? (b.body ?? null) : null,
          b.type === 'result' ? (b.did ?? null) : null,
          b.type === 'result' ? (b.expected ?? null) : null,
          b.type === 'result' ? (b.happened ?? null) : null,
          b.type === 'result' ? (b.verdict ?? null) : null,
        ],
      )
      return res.status(201).json(mapIntel(rows[0]))
    } catch (err) {
      console.warn('[strategy] POST /intel db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  router.put('/intel/:id', async (req, res) => {
    const { id } = req.params
    const b = req.body as {
      type?: string; date?: string; title?: string
      body?: string; did?: string; expected?: string; happened?: string; verdict?: string
    }
    if (!VALID_TYPES.has(b.type ?? '')) return res.status(400).json({ error: 'invalid type' })
    if (!b.title?.trim())               return res.status(400).json({ error: 'title is required' })

    const date = b.date || new Date().toISOString().slice(0, 10)
    try {
      const { rows } = await pool.query(
        `UPDATE strategy_intel
         SET type=$2, date=$3, title=$4, body=$5, did=$6, expected=$7, happened=$8, verdict=$9
         WHERE id=$1
         RETURNING *`,
        [
          id, b.type, date, b.title.trim(),
          b.type === 'note' ? (b.body ?? null) : null,
          b.type === 'result' ? (b.did ?? null) : null,
          b.type === 'result' ? (b.expected ?? null) : null,
          b.type === 'result' ? (b.happened ?? null) : null,
          b.type === 'result' ? (b.verdict ?? null) : null,
        ],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Intel not found' })
      return res.status(200).json(mapIntel(rows[0]))
    } catch (err) {
      console.warn('[strategy] PUT /intel/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  router.delete('/intel/:id', async (req, res) => {
    const { id } = req.params
    try {
      await pool.query('DELETE FROM strategy_intel WHERE id = $1', [id])
      return res.status(204).end()
    } catch (err) {
      console.warn('[strategy] DELETE /intel/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  return router
}
