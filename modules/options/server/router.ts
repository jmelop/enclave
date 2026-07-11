import { Router } from 'express'
import type { DbPool } from '@enclave/sdk'

// Defaults served when a key is unset or the DB is unavailable.
export const DEFAULT_SETTINGS = {
  theme: 'dark',
  currency: 'EUR',
  disabledModules: [] as string[],
}

type SettingKey = keyof typeof DEFAULT_SETTINGS

const VALIDATORS: Record<SettingKey, (value: unknown) => boolean> = {
  theme: v => v === 'dark' || v === 'light',
  currency: v => typeof v === 'string' && ['EUR', 'USD', 'GBP'].includes(v),
  // 'options' can never be disabled — it is the way back.
  disabledModules: v =>
    Array.isArray(v) && v.every(x => typeof x === 'string') && !v.includes('options'),
}

function isSettingKey(key: string): key is SettingKey {
  return key in DEFAULT_SETTINGS
}

export function createOptionsRouter(pool: DbPool): Router {
  const router = Router()

  // ── GET /settings ──────────────────────────────────────────────────────────
  router.get('/settings', async (_req, res) => {
    try {
      const { rows } = await pool.query('SELECT key, value FROM options_settings')
      const stored = Object.fromEntries(rows.map(r => [r['key'] as string, r['value']]))
      return res.json({ ...DEFAULT_SETTINGS, ...stored })
    } catch (err) {
      console.warn('[options] GET /settings db error, using defaults:', err)
      return res.json(DEFAULT_SETTINGS)
    }
  })

  // ── PUT /settings/:key ─────────────────────────────────────────────────────
  router.put('/settings/:key', async (req, res) => {
    const { key } = req.params
    if (!isSettingKey(key)) return res.status(400).json({ error: `unknown setting "${key}"` })

    const { value } = req.body as { value?: unknown }
    if (!VALIDATORS[key](value)) {
      return res.status(400).json({ error: `invalid value for "${key}"` })
    }

    try {
      await pool.query(
        `INSERT INTO options_settings (key, value)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, JSON.stringify(value)],
      )
      return res.status(200).json({ key, value })
    } catch (err) {
      console.warn('[options] PUT /settings/:key db error:', err)
      return res.status(503).json({ error: 'Database unavailable' })
    }
  })

  return router
}
