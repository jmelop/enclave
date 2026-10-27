// Fallback data served by GET /products when the DB is empty or unavailable.
// Same shape as the API response (mapProduct), never used by write paths.

interface SeedProduct {
  id: string
  name: string
  quantity: number
  unit_cost: number
  sale_price: number
  platforms: string | null
  sales_count: number
  created_at: string
  updated_at: string
}

export const SEED_PRODUCTS: SeedProduct[] = [
  { id:'001', name:'Pi 5 case, 3D-printed PETG',  quantity:18, unit_cost:2.10, sale_price:12.00, platforms:'Wallapop, web', sales_count:31, created_at:'2026-02-01T16:44:00.000Z', updated_at:'2026-10-26T08:15:00.000Z' },
  { id:'002', name:'Router wall mount, printed',  quantity:0,  unit_cost:1.30, sale_price:8.00,  platforms:'Wallapop',      sales_count:12, created_at:'2026-07-21T13:13:00.000Z', updated_at:'2026-10-20T09:58:00.000Z' },
  { id:'003', name:'Mechanical switch tester',    quantity:9,  unit_cost:4.20, sale_price:14.00, platforms:null,            sales_count:7,  created_at:'2026-08-30T17:05:00.000Z', updated_at:'2026-10-22T16:26:00.000Z' },
]
