import { Router } from 'express'
import { randomUUID } from 'crypto'
import type { DbPool } from '@enclave/sdk'
import { INITIAL_ITEMS } from './seed'

const VALID_CATEGORIES = new Set(['pc', 'mcu', 'elec', 'tools', 'cable', 'other'])

interface ItemInput {
  name: string
  category: string
  model: string
  qty: number
  location: string
  notes: string
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
    updated:  updatedRaw ? new Date(updatedRaw as string).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  }
}

function validateInput(input: ItemInput): string | null {
  if (!input.name?.trim()) return 'Name is required'
  if (!VALID_CATEGORIES.has(input.category)) return 'Invalid category'
  return null
}

export function createInventoryRouter(pool: DbPool): Router {
  const router = Router()

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
    const validationError = validateInput(input)
    if (validationError) return res.status(400).json({ error: validationError })

    const id = randomUUID()

    try {
      const { rows } = await pool.query(
        `INSERT INTO inventory_items (id, name, category, model, qty, location, notes, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [
          id,
          input.name.trim(),
          input.category,
          input.model ?? '',
          Number(input.qty) || 0,
          input.location ?? '',
          input.notes ?? '',
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
    const validationError = validateInput(input)
    if (validationError) return res.status(400).json({ error: validationError })

    try {
      const { rows } = await pool.query(
        `UPDATE inventory_items
         SET name=$2, category=$3, model=$4, qty=$5, location=$6, notes=$7, updated_at=NOW()
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
