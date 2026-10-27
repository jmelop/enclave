// Row shape returned by GET /products (columns of stock_products).
export interface StockProduct {
  id: string
  name: string
  quantity: number
  unit_cost: number
  sale_price: number
  platforms: string | null   // comma-separated free text, e.g. "Wallapop, web"
  sales_count: number
  created_at: string
  updated_at: string
}

// Fields accepted by POST /products and PUT /products/:id
export type ProductInput = Pick<StockProduct, 'name' | 'quantity' | 'unit_cost' | 'sale_price' | 'platforms' | 'sales_count'>

// Derived client-side from a product; never persisted.
export interface ProductMetrics {
  margin: number       // sale_price - unit_cost, can be negative
  marginPct: number    // margin / sale_price
  through: number      // sell-through: sold / (sold + on hand)
  stockCost: number    // capital tied up in units
  leftToEarn: number   // margin of the remaining units
  revenue: number      // estimate: uses the current price
  profit: number       // estimate: uses the current price and cost
}

// A product as the ledger renders it: display sequence + metrics.
export interface LedgerProduct extends StockProduct {
  seq: number
  draft: boolean       // created locally, not persisted until it has a name
  metrics: ProductMetrics
}

export type StockFilter = 'all' | 'in' | 'out'

export type SortKey = 'seq' | 'name' | 'quantity' | 'unit_cost' | 'sale_price' | 'margin' | 'sales_count'

export type SortDir = 'asc' | 'desc'
