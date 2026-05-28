export const INITIAL_ASSETS = [
  // Real estate
  { id: 'r1', type: 'realestate', name: 'Madrid · Salamanca flat',  amount: 285000, currency: 'EUR', description: 'Direct property · 1BR', valuationDate: '2025-09-12' },
  { id: 'r2', type: 'realestate', name: 'Family land · Galicia',    amount: 45000,  currency: 'EUR', description: 'Family participation 25%', valuationDate: '2024-12-01' },

  // Metals & collectibles
  { id: 'c1', type: 'collectible', name: 'Gold bullion 100g',       amount: 6800,  currency: 'EUR', subtype: 'gold',   description: 'Andorrano · serial #' },
  { id: 'c2', type: 'collectible', name: 'Rolex Submariner 124060', amount: 9500,  currency: 'EUR', subtype: 'watch',  description: '2023 · papers + box' },
  { id: 'c3', type: 'collectible', name: 'Silver coin collection',  amount: 1850,  currency: 'EUR', subtype: 'silver', description: 'Mixed European' },

  // Crypto
  { id: 'k1', type: 'crypto', symbol: 'BTC', name: 'Bitcoin',  price: 43250.75, quantity: 0.5,   changePercent24h: 2.45,  currency: 'USD', description: 'Cold wallet · long-term' },
  { id: 'k2', type: 'crypto', symbol: 'ETH', name: 'Ethereum', price: 2580.90,  quantity: 2.3,   changePercent24h: -1.20, currency: 'USD' },
  { id: 'k3', type: 'crypto', symbol: 'SOL', name: 'Solana',   price: 145.20,   quantity: 18.4,  changePercent24h: 4.81,  currency: 'USD' },

  // Stocks
  { id: 's1', type: 'stock', symbol: 'AAPL', name: 'Apple Inc.',         price: 187.42, quantity: 24, changePercent24h: 0.65,  currency: 'USD' },
  { id: 's2', type: 'stock', symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.20, quantity: 4,  changePercent24h: 3.12,  currency: 'USD', description: 'Core AI thesis' },
  { id: 's3', type: 'stock', symbol: 'ASML', name: 'ASML Holding',       price: 720.40, quantity: 6,  changePercent24h: -0.45, currency: 'EUR' },

  // Funds
  { id: 'f1', type: 'fund', symbol: 'VWCE', name: 'Vanguard FTSE All-World UCITS', price: 118.30, quantity: 65,   changePercent24h: -0.32, currency: 'EUR', isin: 'IE00BK5BQT80', ter: 0.22, distribution: 'Acc', description: 'Core world equity' },
  { id: 'f2', type: 'fund', symbol: 'IWDA', name: 'iShares Core MSCI World',        price: 89.60,  quantity: 35,   changePercent24h: -0.41, currency: 'EUR', isin: 'IE00B4L5Y983', ter: 0.20, distribution: 'Acc' },
  { id: 'f3', type: 'fund', symbol: 'AGGH', name: 'iShares Global Aggregate Bond',  price: 4.85,   quantity: 1200, changePercent24h: 0.12,  currency: 'EUR', isin: 'IE00BDBRDM35', ter: 0.10, distribution: 'Dist', description: 'Bond ballast' },

  // Savings
  { id: 'v1', type: 'savings', name: 'Trade Republic', bank: 'Trade Republic', amount: 8500, currency: 'EUR', apy: 3.75, description: 'Emergency fund' },
  { id: 'v2', type: 'savings', name: 'Revolut Pocket',  bank: 'Revolut',       amount: 4200, currency: 'EUR', apy: 2.20, description: 'Daily checking buffer' },
  { id: 'v3', type: 'savings', name: 'HSBC USD',        bank: 'HSBC',          amount: 3200, currency: 'USD', apy: 4.10, description: 'USD float for travel' },

  // Investments
  { id: 'i1', type: 'investment', name: 'Indexa Capital · Portfolio 9', amount: 12000, currency: 'EUR', subtype: 'roboadvisor', description: '60/40 stocks / bonds' },
  { id: 'i2', type: 'investment', name: 'Mintos · P2P Lending',         amount: 3500,  currency: 'EUR', subtype: 'p2p',         description: 'Auto-invest · 9% target' },
  { id: 'i3', type: 'investment', name: 'Seedrs · Allplants SAFE',      amount: 2000,  currency: 'GBP', subtype: 'startup',     description: 'Pre-seed · 2022 vintage' },
]
