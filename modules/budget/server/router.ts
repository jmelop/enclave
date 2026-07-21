import { Router } from 'express'
import { randomUUID } from 'crypto'
import type { DbPool, DbClient } from '@enclave/sdk'
import {
  SEED_RECURRING, SEED_TARGETS, SEED_MONTH_SUMMARIES, SEED_CATEGORIES,
  buildSeedMonthDetail,
} from './seed'

// Fallback category set used only when budget_categories can't be queried.
const DEFAULT_CATS = new Set(SEED_CATEGORIES.map(c => c.id))

// Categories are user-defined rows in budget_categories.
async function isValidCat(pool: DbPool, cat: string | undefined): Promise<boolean> {
  if (!cat) return false
  try {
    const { rows } = await pool.query('SELECT 1 FROM budget_categories WHERE id = $1', [cat])
    return rows.length > 0
  } catch {
    return DEFAULT_CATS.has(cat)
  }
}

// 'Food & Dining' → 'food-dining' (id slug for a new category)
function slugify(name: string): string {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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

// pg returns DATE columns as a JS Date at LOCAL midnight — toISOString() (UTC)
// would shift it back a day in timezones ahead of UTC, so read local parts.
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mapTransaction(row: Row) {
  const raw = row['date']
  const dateStr = raw instanceof Date
    ? localDateStr(raw)
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

// Income queries select the date as TO_CHAR text, so no Date/timezone handling.
function mapIncome(row: Row) {
  const dateStr = String(row['date'])
  return {
    id:       row['id']     as string,
    name:     row['name']   as string,
    source:   (row['source'] ?? '') as string,
    amount:   Number(row['amount']),
    day:      parseInt(dateStr.slice(8, 10)),
    monthKey: dateStr.slice(0, 7),
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

function mapCategory(row: Row) {
  return {
    id:    row['id']    as string,
    name:  row['name']  as string,
    color: row['color'] as string,
    icon:  row['icon']  as string,
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
    // No source filter: a materialized row edited into 'manual' still counts,
    // otherwise re-running create for the month would duplicate the bill.
    const { rows: exists } = await client.query(
      `SELECT 1 FROM budget_transactions
       WHERE recurring_bill_id = $1
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
      // Collect all distinct month keys from transactions + incomes + budget_months
      const { rows: keyRows } = await pool.query(`
        SELECT DISTINCT TO_CHAR(date, 'YYYY-MM') AS month_key
        FROM budget_transactions
        UNION
        SELECT DISTINCT TO_CHAR(date, 'YYYY-MM') FROM budget_incomes
        UNION
        SELECT month_key FROM budget_months
        ORDER BY 1 DESC
      `)

      if (keyRows.length === 0) return res.json([])

      const keys = keyRows.map(r => r['month_key'] as string)

      const [monthRows, spentRows, incomeRows] = await Promise.all([
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
        pool.query(
          `SELECT TO_CHAR(date, 'YYYY-MM') AS month_key, SUM(amount) AS total
           FROM budget_incomes
           WHERE TO_CHAR(date, 'YYYY-MM') = ANY($1)
           GROUP BY 1`,
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
      const incomeByMonth = new Map(
        incomeRows.rows.map(r => [r['month_key'] as string, Number(r['total'])]),
      )

      return res.json(
        keys.map(key => {
          const mr = monthMap.get(key)
          return {
            key,
            income:  incomeByMonth.get(key) ?? 0,
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
      // First day of next month as plain string math — toISOString() would shift
      // local midnight back a day in TZs ahead of UTC and drop month-end rows.
      const endDate = m === 12
        ? `${y + 1}-01-01`
        : `${y}-${String(m + 1).padStart(2, '0')}-01`

      const [txRows, incomeRows, monthRow, recurringRows, targetRows, categoryRows] = await Promise.all([
        pool.query(
          `SELECT * FROM budget_transactions
           WHERE date >= $1 AND date < $2
           ORDER BY date DESC, amount DESC`,
          [startDate, endDate],
        ),
        pool.query(
          `SELECT id, TO_CHAR(date, 'YYYY-MM-DD') AS date, name, source, amount
           FROM budget_incomes
           WHERE date >= $1 AND date < $2
           ORDER BY date DESC, amount DESC`,
          [startDate, endDate],
        ),
        pool.query('SELECT * FROM budget_months WHERE month_key = $1', [key]),
        pool.query('SELECT * FROM budget_recurring ORDER BY day'),
        pool.query('SELECT * FROM budget_category_targets'),
        pool.query('SELECT * FROM budget_categories ORDER BY sort, id'),
      ])

      const mr = monthRow.rows[0]
      const incomes = incomeRows.rows.map(mapIncome)
      const created = Boolean(mr) || txRows.rows.length > 0
      return res.json({
        key,
        income:       incomes.reduce((s, e) => s + e.amount, 0),
        note:         mr ? String(mr['note'] ?? '') : '',
        asOfDay:      asOfDayFor(key),
        transactions: txRows.rows.map(mapTransaction),
        incomes,
        recurring:    recurringRows.rows.map(mapRecurring),
        targets:      rowsToTargets(targetRows.rows),
        categories:   categoryRows.rows.length > 0 ? categoryRows.rows.map(mapCategory) : SEED_CATEGORIES,
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
    if (!b.name?.trim())                     return res.status(400).json({ error: 'name is required' })
    if (!(await isValidCat(pool, b.cat)))    return res.status(400).json({ error: 'invalid category' })
    if (!b.amount || b.amount <= 0)          return res.status(400).json({ error: 'amount must be > 0' })

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
    if (!b.name?.trim())                  return res.status(400).json({ error: 'name is required' })
    if (!(await isValidCat(pool, b.cat))) return res.status(400).json({ error: 'invalid category' })
    if (!b.amount || b.amount <= 0)       return res.status(400).json({ error: 'amount must be > 0' })

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

  // ── GET /categories ────────────────────────────────────────────────────────
  router.get('/categories', async (_req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM budget_categories ORDER BY sort, id')
      return res.json(rows.length > 0 ? rows.map(mapCategory) : SEED_CATEGORIES)
    } catch (err) {
      console.warn('[budget] GET /categories db error:', err)
      return res.json(SEED_CATEGORIES)
    }
  })

  // ── POST /categories ───────────────────────────────────────────────────────
  // Creates a category and (optionally) its monthly budget target in one go.
  router.post('/categories', async (req, res) => {
    const b = req.body as { name?: string; color?: string; icon?: string; budget?: number }
    const name = b.name?.trim() ?? ''
    if (!name)                                        return res.status(400).json({ error: 'name is required' })
    if (b.color && !/^#[0-9a-fA-F]{6}$/.test(b.color)) return res.status(400).json({ error: 'invalid color' })
    if (b.budget != null && (typeof b.budget !== 'number' || b.budget < 0)) {
      return res.status(400).json({ error: 'budget must be >= 0' })
    }

    const id = slugify(name)
    if (!id) return res.status(400).json({ error: 'name must contain letters or digits' })

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const { rows: exists } = await client.query('SELECT 1 FROM budget_categories WHERE id = $1', [id])
      if (exists.length > 0) {
        await client.query('ROLLBACK')
        return res.status(409).json({ error: `category "${id}" already exists` })
      }

      const { rows } = await client.query(
        `INSERT INTO budget_categories (id, name, color, icon, sort)
         VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(sort), 0) + 1 FROM budget_categories))
         RETURNING *`,
        [id, name, b.color ?? '#6b7280', b.icon?.trim() || 'package'],
      )
      if (b.budget != null && b.budget > 0) {
        await client.query(
          `INSERT INTO budget_category_targets (category, amount)
           VALUES ($1, $2)
           ON CONFLICT (category) DO UPDATE SET amount = EXCLUDED.amount`,
          [id, b.budget],
        )
      }

      await client.query('COMMIT')
      return res.status(201).json(mapCategory(rows[0]))
    } catch (err) {
      try { await client.query('ROLLBACK') } catch { /* swallow */ }
      console.warn('[budget] POST /categories db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    } finally {
      client.release()
    }
  })

  // ── PUT /categories/:id ────────────────────────────────────────────────────
  // Updates a category's display fields (the id stays stable so existing
  // transactions/recurring keep referencing it) plus its monthly budget target.
  router.put('/categories/:id', async (req, res) => {
    const { id } = req.params
    const b = req.body as { name?: string; color?: string; icon?: string; budget?: number }
    const name = b.name?.trim() ?? ''
    if (!name)                                        return res.status(400).json({ error: 'name is required' })
    if (b.color && !/^#[0-9a-fA-F]{6}$/.test(b.color)) return res.status(400).json({ error: 'invalid color' })
    if (b.budget != null && (typeof b.budget !== 'number' || b.budget < 0)) {
      return res.status(400).json({ error: 'budget must be >= 0' })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const { rows } = await client.query(
        `UPDATE budget_categories SET name = $2, color = $3, icon = $4
         WHERE id = $1
         RETURNING *`,
        [id, name, b.color ?? '#6b7280', b.icon?.trim() || 'package'],
      )
      if (rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ error: 'category not found' })
      }
      if (b.budget != null) {
        await client.query(
          `INSERT INTO budget_category_targets (category, amount)
           VALUES ($1, $2)
           ON CONFLICT (category) DO UPDATE SET amount = EXCLUDED.amount`,
          [id, b.budget],
        )
      }

      await client.query('COMMIT')
      return res.status(200).json(mapCategory(rows[0]))
    } catch (err) {
      try { await client.query('ROLLBACK') } catch { /* swallow */ }
      console.warn('[budget] PUT /categories/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    } finally {
      client.release()
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
    if (!(await isValidCat(pool, category))) return res.status(400).json({ error: 'invalid category' })
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
    if (!(await isValidCat(pool, b.cat)))  return res.status(400).json({ error: 'invalid category' })
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
  // Editing detaches the row from its recurring template: source flips to
  // 'manual' (recurring_bill_id is kept so materialization stays idempotent).
  router.put('/transactions/:id', async (req, res) => {
    const { id } = req.params
    const b = req.body as { name?: string; vendor?: string; amount?: number; cat?: string; day?: number; monthKey?: string }
    if (!b.name?.trim())                  return res.status(400).json({ error: 'name is required' })
    if (!(await isValidCat(pool, b.cat))) return res.status(400).json({ error: 'invalid category' })
    if (!b.amount || b.amount <= 0)       return res.status(400).json({ error: 'amount must be > 0' })
    if (!b.monthKey || !/^\d{4}-\d{2}$/.test(b.monthKey)) {
      return res.status(400).json({ error: 'invalid monthKey' })
    }

    const dateStr = makeDateStr(b.monthKey, b.day ?? 1)
    try {
      const { rows } = await pool.query(
        `UPDATE budget_transactions
         SET name=$2, vendor=$3, amount=$4, category=$5, date=$6, source='manual'
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

  // ── POST /incomes ──────────────────────────────────────────────────────────
  router.post('/incomes', async (req, res) => {
    const b = req.body as { name?: string; source?: string; amount?: number; day?: number; monthKey?: string }
    if (!b.name?.trim())            return res.status(400).json({ error: 'name is required' })
    if (!b.amount || b.amount <= 0) return res.status(400).json({ error: 'amount must be > 0' })
    if (!b.monthKey || !/^\d{4}-\d{2}$/.test(b.monthKey)) {
      return res.status(400).json({ error: 'invalid monthKey' })
    }

    const id = randomUUID()
    const dateStr = makeDateStr(b.monthKey, b.day ?? 1)
    try {
      const { rows } = await pool.query(
        `INSERT INTO budget_incomes (id, date, name, source, amount)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, TO_CHAR(date, 'YYYY-MM-DD') AS date, name, source, amount`,
        [id, dateStr, b.name.trim(), b.source?.trim() ?? '', b.amount],
      )
      return res.status(201).json(mapIncome(rows[0]))
    } catch (err) {
      console.warn('[budget] POST /incomes db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  // ── PUT /incomes/:id ───────────────────────────────────────────────────────
  router.put('/incomes/:id', async (req, res) => {
    const { id } = req.params
    const b = req.body as { name?: string; source?: string; amount?: number; day?: number; monthKey?: string }
    if (!b.name?.trim())            return res.status(400).json({ error: 'name is required' })
    if (!b.amount || b.amount <= 0) return res.status(400).json({ error: 'amount must be > 0' })
    if (!b.monthKey || !/^\d{4}-\d{2}$/.test(b.monthKey)) {
      return res.status(400).json({ error: 'invalid monthKey' })
    }

    const dateStr = makeDateStr(b.monthKey, b.day ?? 1)
    try {
      const { rows } = await pool.query(
        `UPDATE budget_incomes
         SET name=$2, source=$3, amount=$4, date=$5
         WHERE id=$1
         RETURNING id, TO_CHAR(date, 'YYYY-MM-DD') AS date, name, source, amount`,
        [id, b.name.trim(), b.source?.trim() ?? '', b.amount, dateStr],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Income not found' })
      return res.status(200).json(mapIncome(rows[0]))
    } catch (err) {
      console.warn('[budget] PUT /incomes/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  // ── DELETE /incomes/:id ────────────────────────────────────────────────────
  router.delete('/incomes/:id', async (req, res) => {
    const { id } = req.params
    try {
      await pool.query('DELETE FROM budget_incomes WHERE id = $1', [id])
      return res.status(204).end()
    } catch (err) {
      console.warn('[budget] DELETE /incomes/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  return router
}

// Re-export helper used by server.config
export { monthKeyOf }
