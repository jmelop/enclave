import { Router } from 'express'
import { randomUUID } from 'crypto'
import type { DbPool } from '@enclave/sdk'
import { INITIAL_ITEMS, SEED_CATEGORIES } from './seed'

// Fallback category set used only when inventory_categories can't be queried.
const DEFAULT_CATS = new Set(SEED_CATEGORIES.map(c => c.id))

// Categories are user-defined rows in inventory_categories.
async function isValidCat(pool: DbPool, cat: string | undefined): Promise<boolean> {
  if (!cat) return false
  try {
    const { rows } = await pool.query('SELECT 1 FROM inventory_categories WHERE id = $1', [cat])
    return rows.length > 0
  } catch {
    return DEFAULT_CATS.has(cat)
  }
}

// 'PLA Filament' → 'pla-filament' (id slug for a new category)
function slugify(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface CategoryInput {
  label?: string
  short?: string
  hue?: number
  lowThreshold?: number
}

// Returns the normalised fields or an error message.
function parseCategory(b: CategoryInput): { label: string; short: string; hue: number; lowThreshold: number } | string {
  const label = b.label?.trim() ?? ''
  if (!label) return 'label is required'
  const hue = b.hue ?? 260
  if (typeof hue !== 'number' || !Number.isInteger(hue) || hue < 0 || hue > 360) return 'hue must be an integer 0-360'
  const lowThreshold = b.lowThreshold ?? 3
  if (typeof lowThreshold !== 'number' || !Number.isInteger(lowThreshold) || lowThreshold < 0) return 'lowThreshold must be a non-negative integer'
  const short = (b.short?.trim() || label.split(/\s+/)[0]).toUpperCase().slice(0, 8)
  return { label, short, hue, lowThreshold }
}

function mapCategory(row: ItemRow) {
  return {
    id:    row['id'] as string,
    label: row['label'] as string,
    short: row['short'] as string,
    hue:   Number(row['hue']),
    lowThreshold: Number(row['low_threshold'] ?? 3),
  }
}

interface ItemInput {
  name: string
  category: string
  model: string
  qty: number
  location: string
  notes: string
  price?: number | null
}

type ItemRow = Record<string, unknown>

function mapItem(row: ItemRow) {
  const updatedRaw = row['updated_at']
  return {
    id:       row['id'] as string,
    name:     row['name'] as string,
    category: row['category'] as string,
    model:    (row['model'] ?? '') as string,
    qty:      Number(row['qty'] ?? 0),
    location: (row['location'] ?? '') as string,
    notes:    (row['notes'] ?? '') as string,
    price:    row['price'] == null ? null : Number(row['price']),
    updated:  updatedRaw ? new Date(updatedRaw as string).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  }
}

async function validateInput(pool: DbPool, input: ItemInput): Promise<string | null> {
  if (!input.name?.trim()) return 'Name is required'
  if (!(await isValidCat(pool, input.category))) return 'Invalid category'
  if (input.price != null && (typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price < 0)) {
    return 'price must be a non-negative number'
  }
  return null
}

export function createInventoryRouter(pool: DbPool): Router {
  const router = Router()

  router.get('/categories', async (_req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM inventory_categories ORDER BY sort, id')
      res.json(rows.length > 0 ? rows.map(mapCategory) : SEED_CATEGORIES)
    } catch (err) {
      console.warn('[inventory] /categories db unavailable, using seed:', err)
      res.json(SEED_CATEGORIES)
    }
  })

  router.post('/categories', async (req, res) => {
    const parsed = parseCategory(req.body as CategoryInput)
    if (typeof parsed === 'string') return res.status(400).json({ error: parsed })

    const id = slugify(parsed.label)
    if (!id) return res.status(400).json({ error: 'label must contain letters or digits' })

    try {
      const { rows } = await pool.query(
        `INSERT INTO inventory_categories (id, label, short, hue, low_threshold, sort)
         VALUES ($1, $2, $3, $4, $5, (SELECT COALESCE(MAX(sort), 0) + 1 FROM inventory_categories))
         ON CONFLICT (id) DO NOTHING
         RETURNING *`,
        [id, parsed.label, parsed.short, parsed.hue, parsed.lowThreshold],
      )
      if (rows.length === 0) return res.status(409).json({ error: `category "${id}" already exists` })
      return res.status(201).json(mapCategory(rows[0]))
    } catch (err) {
      console.warn('[inventory] POST /categories db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot save category' })
    }
  })

  // The id stays stable so existing items keep referencing it.
  router.put('/categories/:id', async (req, res) => {
    const { id } = req.params
    const parsed = parseCategory(req.body as CategoryInput)
    if (typeof parsed === 'string') return res.status(400).json({ error: parsed })

    try {
      const { rows } = await pool.query(
        `UPDATE inventory_categories SET label=$2, short=$3, hue=$4, low_threshold=$5
         WHERE id=$1
         RETURNING *`,
        [id, parsed.label, parsed.short, parsed.hue, parsed.lowThreshold],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Category not found' })
      return res.status(200).json(mapCategory(rows[0]))
    } catch (err) {
      console.warn('[inventory] PUT /categories/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot update category' })
    }
  })

  router.get('/items', async (_req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM inventory_items ORDER BY category, id')
      res.json(rows.length > 0 ? rows.map(mapItem) : INITIAL_ITEMS)
    } catch (err) {
      console.warn('[inventory] /items db unavailable, using seed:', err)
      res.json(INITIAL_ITEMS)
    }
  })

  router.post('/items', async (req, res) => {
    const input = req.body as ItemInput
    const validationError = await validateInput(pool, input)
    if (validationError) return res.status(400).json({ error: validationError })

    const id = randomUUID()

    try {
      const { rows } = await pool.query(
        `INSERT INTO inventory_items (id, name, category, model, qty, location, notes, price, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
        [
          id,
          input.name.trim(),
          input.category,
          input.model ?? '',
          Number(input.qty) || 0,
          input.location ?? '',
          input.notes ?? '',
          input.price ?? null,
        ],
      )
      return res.status(201).json(mapItem(rows[0]))
    } catch (err) {
      console.warn('[inventory] POST /items db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot save item' })
    }
  })

  router.put('/items/:id', async (req, res) => {
    const { id } = req.params
    const input = req.body as ItemInput
    const validationError = await validateInput(pool, input)
    if (validationError) return res.status(400).json({ error: validationError })

    try {
      const { rows } = await pool.query(
        `UPDATE inventory_items
         SET name=$2, category=$3, model=$4, qty=$5, location=$6, notes=$7, price=$8, updated_at=NOW()
         WHERE id=$1
         RETURNING *`,
        [
          id,
          input.name.trim(),
          input.category,
          input.model ?? '',
          Number(input.qty) || 0,
          input.location ?? '',
          input.notes ?? '',
          input.price ?? null,
        ],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Item not found' })
      return res.status(200).json(mapItem(rows[0]))
    } catch (err) {
      console.warn('[inventory] PUT /items/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot update item' })
    }
  })

  router.patch('/items/:id/qty', async (req, res) => {
    const { id } = req.params
    const { delta } = req.body as { delta: number }

    if (typeof delta !== 'number' || !Number.isFinite(delta)) {
      return res.status(400).json({ error: 'delta must be a finite number' })
    }

    try {
      const { rows: found } = await pool.query(
        'SELECT qty FROM inventory_items WHERE id = $1',
        [id],
      )
      if (found.length === 0) return res.status(404).json({ error: 'Item not found' })

      const next = Number(found[0]['qty']) + delta
      if (next < 0) return res.status(400).json({ error: 'Quantity cannot go below 0' })

      const { rows } = await pool.query(
        'UPDATE inventory_items SET qty=$2, updated_at=NOW() WHERE id=$1 RETURNING *',
        [id, next],
      )
      return res.status(200).json(mapItem(rows[0]))
    } catch (err) {
      console.warn('[inventory] PATCH /items/:id/qty db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot update quantity' })
    }
  })

  router.delete('/items/:id', async (req, res) => {
    const { id } = req.params
    try {
      const { rows } = await pool.query(
        'DELETE FROM inventory_items WHERE id=$1 RETURNING id',
        [id],
      )
      // Idempotent 204: seed IDs (e.g. '001') may not exist in DB when fallback is active.
      void rows
      return res.status(204).end()
    } catch (err) {
      console.warn('[inventory] DELETE /items/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot delete item' })
    }
  })

  return router
}
