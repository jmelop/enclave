import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'crypto'
import type { DbPool } from '@enclave/sdk'
import { SEED_PRODUCTS } from './seed'

// NUMERIC(10,2) upper bound; INTEGER upper bound.
const MAX_MONEY = 99_999_999.99
const MAX_INT   = 2_147_483_647

interface ProductInput {
  name?: string
  quantity?: number
  unit_cost?: number
  sale_price?: number
  platforms?: string | null
  sales_count?: number
}

interface ProductFields {
  name: string
  quantity: number
  unit_cost: number
  sale_price: number
  platforms: string | null
  sales_count: number
}

type ProductRow = Record<string, unknown>

// 'web, Wallapop,  WEB' → 'web, Wallapop' (case-insensitive dedupe); empty → null
function normalizePlatforms(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const seen = new Set<string>()
  const list = raw.split(',').map(p => p.trim()).filter(p => {
    if (!p || seen.has(p.toLowerCase())) return false
    seen.add(p.toLowerCase())
    return true
  })
  return list.length > 0 ? list.join(', ') : null
}

const isCount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= MAX_INT

const isMoney = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_MONEY

// Returns the normalised fields or an error message.
function parseProduct(b: ProductInput): ProductFields | string {
  const name = typeof b.name === 'string' ? b.name.trim() : ''
  if (!name) return 'Name is required'

  const quantity    = b.quantity ?? 0
  const sales_count = b.sales_count ?? 0
  const unit_cost   = b.unit_cost ?? 0
  const sale_price  = b.sale_price ?? 0
  if (!isCount(quantity))    return 'quantity must be a non-negative integer'
  if (!isCount(sales_count)) return 'sales_count must be a non-negative integer'
  if (!isMoney(unit_cost))   return 'unit_cost must be a non-negative number'
  if (!isMoney(sale_price))  return 'sale_price must be a non-negative number'
  if (b.platforms != null && typeof b.platforms !== 'string') return 'platforms must be text or null'

  return {
    name,
    quantity,
    sales_count,
    unit_cost:  Math.round(unit_cost * 100) / 100,
    sale_price: Math.round(sale_price * 100) / 100,
    platforms:  normalizePlatforms(b.platforms),
  }
}

// node-postgres returns NUMERIC as strings — converted here so the API always speaks numbers.
function mapProduct(row: ProductRow) {
  return {
    id:          row['id'] as string,
    name:        row['name'] as string,
    quantity:    Number(row['quantity'] ?? 0),
    unit_cost:   Number(row['unit_cost'] ?? 0),
    sale_price:  Number(row['sale_price'] ?? 0),
    platforms:   (row['platforms'] ?? null) as string | null,
    sales_count: Number(row['sales_count'] ?? 0),
    created_at:  new Date(row['created_at'] as string).toISOString(),
    updated_at:  new Date(row['updated_at'] as string).toISOString(),
  }
}

export function createStockRouter(pool: DbPool): Router {
  const router = Router()

  // Atomic ±1 sale. No row back means the product is missing (404) or the guard failed (409).
  const moveSale = (sql: string, conflict: string) => async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params
    try {
      const { rows } = await pool.query(sql, [id])
      if (rows.length > 0) return res.status(200).json(mapProduct(rows[0]))
      const { rows: found } = await pool.query('SELECT 1 FROM stock_products WHERE id = $1', [id])
      if (found.length === 0) return res.status(404).json({ error: 'Product not found' })
      return res.status(409).json({ error: conflict })
    } catch (err) {
      console.warn(`[stock] ${req.path} db error:`, err)
      return res.status(503).json({ error: 'Database unavailable, cannot record sale' })
    }
  }

  router.get('/products', async (_req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM stock_products ORDER BY created_at, id')
      res.json(rows.length > 0 ? rows.map(mapProduct) : SEED_PRODUCTS)
    } catch (err) {
      console.warn('[stock] /products db unavailable, using seed:', err)
      res.json(SEED_PRODUCTS)
    }
  })

  router.post('/products', async (req, res) => {
    const parsed = parseProduct(req.body as ProductInput)
    if (typeof parsed === 'string') return res.status(400).json({ error: parsed })

    try {
      const { rows } = await pool.query(
        `INSERT INTO stock_products (id, name, quantity, unit_cost, sale_price, platforms, sales_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [randomUUID(), parsed.name, parsed.quantity, parsed.unit_cost, parsed.sale_price, parsed.platforms, parsed.sales_count],
      )
      return res.status(201).json(mapProduct(rows[0]))
    } catch (err) {
      console.warn('[stock] POST /products db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot save product' })
    }
  })

  router.put('/products/:id', async (req, res) => {
    const { id } = req.params
    const parsed = parseProduct(req.body as ProductInput)
    if (typeof parsed === 'string') return res.status(400).json({ error: parsed })

    try {
      const { rows } = await pool.query(
        `UPDATE stock_products
         SET name=$2, quantity=$3, unit_cost=$4, sale_price=$5, platforms=$6, sales_count=$7, updated_at=NOW()
         WHERE id=$1
         RETURNING *`,
        [id, parsed.name, parsed.quantity, parsed.unit_cost, parsed.sale_price, parsed.platforms, parsed.sales_count],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Product not found' })
      return res.status(200).json(mapProduct(rows[0]))
    } catch (err) {
      console.warn('[stock] PUT /products/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot update product' })
    }
  })

  router.post('/products/:id/sell', moveSale(
    `UPDATE stock_products
     SET quantity = quantity - 1, sales_count = sales_count + 1, updated_at = NOW()
     WHERE id = $1 AND quantity > 0
     RETURNING *`,
    'Out of stock',
  ))

  router.post('/products/:id/unsell', moveSale(
    `UPDATE stock_products
     SET quantity = quantity + 1, sales_count = sales_count - 1, updated_at = NOW()
     WHERE id = $1 AND sales_count > 0
     RETURNING *`,
    'No sales to undo',
  ))

  router.delete('/products/:id', async (req, res) => {
    const { id } = req.params
    try {
      // Idempotent 204: seed IDs (e.g. '001') may not exist in DB when fallback is active.
      await pool.query('DELETE FROM stock_products WHERE id=$1', [id])
      return res.status(204).end()
    } catch (err) {
      console.warn('[stock] DELETE /products/:id db error:', err)
      return res.status(503).json({ error: 'Database unavailable, cannot delete product' })
    }
  })

  return router
}
