import { Router } from 'express'
import { randomUUID } from 'crypto'
import type { DbPool, DbClient } from '@enclave/sdk'
import {
  SEED_RECURRING, SEED_TARGETS, SEED_MONTH_SUMMARIES,
  buildSeedMonthDetail,
} from './seed'

const VALID_CATS = new Set([
  'food','transport','housing','health','entertainment','subscriptions','other',
])

type Row = Record<string, unknown>

// ── Date / month helpers ──────────────────────────────────────────────────────

function daysInMonth(year: number, monthZeroIdx: number): number {
  return new Date(year, monthZeroIdx + 1, 0).getDate()
}

function monthKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function currentMonthKey(): string {
  return monthKeyFromDate(new Date())
}

function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function asOfDayFor(key: string): number {
  const [y, m] = key.split('-').map(Number)
  const current = currentMonthKey()
  if (key > current) return 0
  if (key === current) return new Date().getDate()
  return daysInMonth(y, m - 1)
}

// Compose a DATE string from a 'YYYY-MM' key + day (clamped to valid range).
function makeDateStr(monthKey: string, day: number): string {
  const [y, m] = monthKey.split('-').map(Number)
  const max = daysInMonth(y, m - 1)
  const clamped = Math.min(Math.max(1, day), max)
  return `${monthKey}-${String(clamped).padStart(2, '0')}`
}

// ── Row mappers ───────────────────────────────────────────────────────────────

function mapTransaction(row: Row) {
  const raw = row['date']
  const dateStr = raw instanceof Date
    ? raw.toISOString().slice(0, 10)
    : String(raw).slice(0, 10)
  const day = parseInt(dateStr.slice(8, 10))
  const monthKey = dateStr.slice(0, 7)
  const source = row['source'] as string
  return {
    id:         row['id']     as string,
    name:       row['name']   as string,
    vendor:     (row['vendor'] ?? '') as string,
    amount:     Number(row['amount']),
    cat:        row['category'] as string,
    day,
    monthKey,
    ...(source === 'recurring' ? { recurring: true } : {}),
    ...(source === 'manual'    ? { manual: true }    : {}),
  }
}

function mapRecurring(row: Row) {
  return {
    id:       row['id']     as string,
    name:     row['name']   as string,
    vendor:   (row['vendor'] ?? '') as string,
    amount:   Number(row['amount']),
    cat:      row['category'] as string,
    day:      Number(row['day']),
    ...(row['variable'] ? { variable: true } : {}),
  }
}

function rowsToTargets(rows: Row[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rows) out[r['category'] as string] = Number(r['amount'])
  return out
}

// ── Lazy materialization ──────────────────────────────────────────────────────

interface RecurringBillRow {
  id: string
  name: string
  vendor: string
  amount: number
  category: string
  day: number
}

// Insert one recurring bill as a materialized transaction for a given month.
async function insertRecurringAsTransaction(
  client: DbClient,
  bill: RecurringBillRow,
  monthKey: string,
): Promise<void> {
  const dateStr = makeDateStr(monthKey, bill.day)
  await client.query(
    `INSERT INTO budget_transactions
       (id, date, name, vendor, amount, category, source, recurring_bill_id)
     VALUES ($1, $2, $3, $4, $5, $6, 'recurring', $7)`,
    [randomUUID(), dateStr, bill.name, bill.vendor, bill.amount, bill.category, bill.id],
  )
}

// Called inside a BEGIN transaction. Idempotent per recurring bill + month.
async function materializeMonth(client: DbClient, monthKey: string): Promise<void> {
  if (monthKey > currentMonthKey()) return  // never materialize future months

  const { rows: bills } = await client.query('SELECT * FROM budget_recurring')
  if (bills.length === 0) return

  for (const bill of bills) {
    const { rows: exists } = await client.query(
      `SELECT 1 FROM budget_transactions
       WHERE source = 'recurring'
         AND recurring_bill_id = $1
         AND TO_CHAR(date, 'YYYY-MM') = $2
       LIMIT 1`,
      [bill['id'], monthKey],
    )
    if (exists.length > 0) continue

    await insertRecurringAsTransaction(
      client,
      {
        id:       bill['id'] as string,
        name:     bill['name'] as string,
        vendor:   (bill['vendor'] ?? '') as string,
        amount:   Number(bill['amount']),
        category: bill['category'] as string,
        day:      Number(bill['day']),
      },
      monthKey,
    )
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export function createBudgetRouter(pool: DbPool): Router {
  const router = Router()

  // ── GET /months (history list) ─────────────────────────────────────────────
  router.get('/months', async (_req, res) => {
    try {
      // Collect all distinct month keys from transactions + budget_months
      const { rows: keyRows } = await pool.query(`
        SELECT DISTINCT TO_CHAR(date, 'YYYY-MM') AS month_key
        FROM budget_transactions
        UNION
        SELECT month_key FROM budget_months
        ORDER BY 1 DESC
      `)

      if (keyRows.length === 0) return res.json([])

      const keys = keyRows.map(r => r['month_key'] as string)

      const [monthRows, spentRows] = await Promise.all([
        pool.query(
          'SELECT * FROM budget_months WHERE month_key = ANY($1)',
          [keys],
        ),
        pool.query(
          `SELECT TO_CHAR(date, 'YYYY-MM') AS month_key, category, SUM(amount) AS total
           FROM budget_transactions
           WHERE TO_CHAR(date, 'YYYY-MM') = ANY($1)
           GROUP BY 1, 2`,
          [keys],
        ),
      ])

      const monthMap = new Map(monthRows.rows.map(r => [r['month_key'] as string, r]))
      const spentByMonth = new Map<string, Record<string, number>>()
      for (const r of spentRows.rows) {
        const mk = r['month_key'] as string
        if (!spentByMonth.has(mk)) spentByMonth.set(mk, {})
        spentByMonth.get(mk)![r['category'] as string] = Number(r['total'])
      }

      return res.json(
        keys.map(key => {
          const mr = monthMap.get(key)
          return {
            key,
            income:  mr ? Number(mr['income']) : 0,
            note:    mr ? String(mr['note'] ?? '') : '',
            asOfDay: asOfDayFor(key),
            spent:   spentByMonth.get(key) ?? {},
            created: true,
          }
        }),
      )
    } catch (err) {
      console.warn('[budget] GET /months db unavailable, using seed:', err)
      return res.json(SEED_MONTH_SUMMARIES)
    }
  })

  // ── GET /months/:key ───────────────────────────────────────────────────────
  router.get('/months/:key', async (req, res) => {
    const { key } = req.params
    if (!/^\d{4}-\d{2}$/.test(key)) {
      return res.status(400).json({ error: 'invalid month key format' })
    }

    try {
      const [y, m] = key.split('-').map(Number)
      const startDate = `${key}-01`
      // First day of next month (using JS Date: month is 1-indexed here, Date is 0-indexed)
      const nextMonthDate = new Date(y, m, 1)  // m = month index 0-based for next month ✓
      const endDate = nextMonthDate.toISOString().slice(0, 10)

      const [txRows, monthRow, recurringRows, targetRows] = await Promise.all([
        pool.query(
          `SELECT * FROM budget_transactions
           WHERE date >= $1 AND date < $2
           ORDER BY date DESC, amount DESC`,
          [startDate, endDate],
        ),
        pool.query('SELECT * FROM budget_months WHERE month_key = $1', [key]),
        pool.query('SELECT * FROM budget_recurring ORDER BY day'),
        pool.query('SELECT * FROM budget_category_targets'),
      ])

      const mr = monthRow.rows[0]
      const created = Boolean(mr) || txRows.rows.length > 0
      return res.json({
        key,
        income:       mr ? Number(mr['income']) : 0,
        note:         mr ? String(mr['note'] ?? '') : '',
        asOfDay:      asOfDayFor(key),
        transactions: txRows.rows.map(mapTransaction),
        recurring:    recurringRows.rows.map(mapRecurring),
        targets:      rowsToTargets(targetRows.rows),
        created,
      })
    } catch (err) {
      console.warn('[budget] GET /months/:key db error:', err)
      return res.json(buildSeedMonthDetail(key))
    }
  })

  // ── POST /months/:key/create ────────────────────────────────────────────────
  router.post('/months/:key/create', async (req, res) => {
    const { key } = req.params
    if (!/^\d{4}-\d{2}$/.test(key)) {
      return res.status(400).json({ error: 'invalid month key format' })
    }
    if (key > currentMonthKey()) {
      return res.status(400).json({ error: 'cannot create a future month' })
    }

    const { income, note } = req.body as { income?: number; note?: string }
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO budget_months (month_key, income, note)
         VALUES ($1, $2, $3)
         ON CONFLICT (month_key) DO UPDATE
           SET income = budget_months.income,
               note   = budget_months.note`,
        [key, Number(income) || 0, note ?? ''],
      )
      await materializeMonth(client, key)
      await client.query('COMMIT')
      return res.status(201).json({ key, created: true })
    } catch (err) {
      try { await client.query('ROLLBACK') } catch { /* swallow */ }
      console.warn('[budget] POST /months/:key/create db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    } finally {
      client.release()
    }
  })

  // ── PUT /months/:key (set income / note) ───────────────────────────────────
  router.put('/months/:key', async (req, res) => {
    const { key } = req.params
    if (!/^\d{4}-\d{2}$/.test(key)) {
      return res.status(400).json({ error: 'invalid month key format' })
    }
    const { income, note } = req.body as { income?: number; note?: string }

    try {
      await pool.query(
        `INSERT INTO budget_months (month_key, income, note)
         VALUES ($1, $2, $3)
         ON CONFLICT (month_key) DO UPDATE
           SET income = EXCLUDED.income,
               note   = EXCLUDED.note`,
        [key, Number(income) || 0, note ?? ''],
      )
      return res.status(200).json({ key, income: Number(income) || 0, note: note ?? '' })
    } catch (err) {
      console.warn('[budget] PUT /months/:key db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  // ── GET /recurring ─────────────────────────────────────────────────────────
  router.get('/recurring', async (_req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM budget_recurring ORDER BY day')
      return res.json(rows.length > 0 ? rows.map(mapRecurring) : SEED_RECURRING)
    } catch (err) {
      console.warn('[budget] GET /recurring db error:', err)
      return res.json(SEED_RECURRING)
    }
  })

  // ── POST /recurring ────────────────────────────────────────────────────────
  // Inserts the template AND immediately materializes it as a transaction for
  // the current month. Historical months pick it up when the user creates them.
  router.post('/recurring', async (req, res) => {
    const b = req.body as { name?: string; vendor?: string; amount?: number; cat?: string; day?: number; variable?: boolean }
    if (!b.name?.trim())              return res.status(400).json({ error: 'name is required' })
    if (!VALID_CATS.has(b.cat ?? '')) return res.status(400).json({ error: 'invalid category' })
    if (!b.amount || b.amount <= 0)   return res.status(400).json({ error: 'amount must be > 0' })

    const id = randomUUID()
    const clampedDay = Math.min(31, Math.max(1, b.day ?? 1))
    const vendor = b.vendor?.trim() ?? b.name.trim()
    const monthKey = currentMonthKey()

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const { rows } = await client.query(
        `INSERT INTO budget_recurring (id, name, vendor, amount, category, day, variable)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, b.name.trim(), vendor, b.amount, b.cat, clampedDay, b.variable ?? false],
      )
      const bill = rows[0]

      // Idempotency guard (safety for retries — a brand-new id won't exist yet)
      const { rows: txExists } = await client.query(
        `SELECT 1 FROM budget_transactions
         WHERE recurring_bill_id = $1
           AND TO_CHAR(date, 'YYYY-MM') = $2
         LIMIT 1`,
        [id, monthKey],
      )
      if (txExists.length === 0) {
        await insertRecurringAsTransaction(
          client,
          {
            id:       bill['id'] as string,
            name:     bill['name'] as string,
            vendor:   (bill['vendor'] ?? '') as string,
            amount:   Number(bill['amount']),
            category: bill['category'] as string,
            day:      Number(bill['day']),
          },
          monthKey,
        )
      }

      await client.query('COMMIT')
      return res.status(201).json(mapRecurring(bill))
    } catch (err) {
      try { await client.query('ROLLBACK') } catch { /* swallow */ }
      console.warn('[budget] POST /recurring db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    } finally {
      client.release()
    }
  })

  // ── PUT /recurring/:id ─────────────────────────────────────────────────────
  router.put('/recurring/:id', async (req, res) => {
    const { id } = req.params
    const b = req.body as { name?: string; vendor?: string; amount?: number; cat?: string; day?: number; variable?: boolean }
    if (!b.name?.trim())              return res.status(400).json({ error: 'name is required' })
    if (!VALID_CATS.has(b.cat ?? '')) return res.status(400).json({ error: 'invalid category' })
    if (!b.amount || b.amount <= 0)   return res.status(400).json({ error: 'amount must be > 0' })

    try {
      const { rows } = await pool.query(
        `UPDATE budget_recurring
         SET name=$2, vendor=$3, amount=$4, category=$5, day=$6, variable=$7
         WHERE id=$1
         RETURNING *`,
        [id, b.name.trim(), b.vendor?.trim() ?? b.name.trim(), b.amount, b.cat,
         Math.min(31, Math.max(1, b.day ?? 1)), b.variable ?? false],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Recurring bill not found' })
      return res.status(200).json(mapRecurring(rows[0]))
    } catch (err) {
      console.warn('[budget] PUT /recurring/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  // ── DELETE /recurring/:id ──────────────────────────────────────────────────
  // Hard delete; materialized transactions keep recurring_bill_id = NULL via FK.
  router.delete('/recurring/:id', async (req, res) => {
    const { id } = req.params
    try {
      await pool.query('DELETE FROM budget_recurring WHERE id = $1', [id])
      return res.status(204).end()
    } catch (err) {
      console.warn('[budget] DELETE /recurring/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  // ── GET /targets ───────────────────────────────────────────────────────────
  router.get('/targets', async (_req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM budget_category_targets')
      return res.json(rows.length > 0 ? rowsToTargets(rows) : SEED_TARGETS)
    } catch (err) {
      console.warn('[budget] GET /targets db error:', err)
      return res.json(SEED_TARGETS)
    }
  })

  // ── PUT /targets/:category ─────────────────────────────────────────────────
  router.put('/targets/:category', async (req, res) => {
    const { category } = req.params
    if (!VALID_CATS.has(category)) return res.status(400).json({ error: 'invalid category' })
    const { amount } = req.body as { amount?: number }
    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ error: 'amount must be >= 0' })
    }
    try {
      await pool.query(
        `INSERT INTO budget_category_targets (category, amount)
         VALUES ($1, $2)
         ON CONFLICT (category) DO UPDATE SET amount = EXCLUDED.amount`,
        [category, amount],
      )
      return res.status(200).json({ category, amount })
    } catch (err) {
      console.warn('[budget] PUT /targets/:category db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  // ── POST /transactions ─────────────────────────────────────────────────────
  router.post('/transactions', async (req, res) => {
    const b = req.body as { name?: string; vendor?: string; amount?: number; cat?: string; day?: number; monthKey?: string }
    if (!b.name?.trim())                   return res.status(400).json({ error: 'name is required' })
    if (!VALID_CATS.has(b.cat ?? ''))      return res.status(400).json({ error: 'invalid category' })
    if (!b.amount || b.amount <= 0)        return res.status(400).json({ error: 'amount must be > 0' })
    if (!b.monthKey || !/^\d{4}-\d{2}$/.test(b.monthKey)) {
      return res.status(400).json({ error: 'invalid monthKey' })
    }

    const id = randomUUID()
    const dateStr = makeDateStr(b.monthKey, b.day ?? 1)
    try {
      const { rows } = await pool.query(
        `INSERT INTO budget_transactions (id, date, name, vendor, amount, category, source)
         VALUES ($1, $2, $3, $4, $5, $6, 'manual')
         RETURNING *`,
        [id, dateStr, b.name.trim(), b.vendor?.trim() ?? b.name.trim(), b.amount, b.cat],
      )
      return res.status(201).json(mapTransaction(rows[0]))
    } catch (err) {
      console.warn('[budget] POST /transactions db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  // ── PUT /transactions/:id ──────────────────────────────────────────────────
  router.put('/transactions/:id', async (req, res) => {
    const { id } = req.params
    const b = req.body as { name?: string; vendor?: string; amount?: number; cat?: string; day?: number; monthKey?: string }
    if (!b.name?.trim())              return res.status(400).json({ error: 'name is required' })
    if (!VALID_CATS.has(b.cat ?? '')) return res.status(400).json({ error: 'invalid category' })
    if (!b.amount || b.amount <= 0)   return res.status(400).json({ error: 'amount must be > 0' })
    if (!b.monthKey || !/^\d{4}-\d{2}$/.test(b.monthKey)) {
      return res.status(400).json({ error: 'invalid monthKey' })
    }

    const dateStr = makeDateStr(b.monthKey, b.day ?? 1)
    try {
      const { rows } = await pool.query(
        `UPDATE budget_transactions
         SET name=$2, vendor=$3, amount=$4, category=$5, date=$6
         WHERE id=$1
         RETURNING *`,
        [id, b.name.trim(), b.vendor?.trim() ?? b.name.trim(), b.amount, b.cat, dateStr],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Transaction not found' })
      return res.status(200).json(mapTransaction(rows[0]))
    } catch (err) {
      console.warn('[budget] PUT /transactions/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  // ── DELETE /transactions/:id ───────────────────────────────────────────────
  router.delete('/transactions/:id', async (req, res) => {
    const { id } = req.params
    try {
      await pool.query('DELETE FROM budget_transactions WHERE id = $1', [id])
      return res.status(204).end()
    } catch (err) {
      console.warn('[budget] DELETE /transactions/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  return router
}

// Re-export helper used by server.config
export { monthKeyOf }
