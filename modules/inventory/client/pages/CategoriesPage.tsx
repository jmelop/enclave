import { useMemo } from 'react'
import { Card } from '@venator-ui/ui'
import { useInventoryStore } from '@/store/inventoryStore'
import { catBg, catBorder, catDot, catFg } from '@/lib/utils'
import type { Category } from '@/types/inventory'

interface CategoryStats extends Category {
  items: number
  units: number
  alerts: number   // items flagged low or out
}

interface CategoriesPageProps {
  onEdit: (category: Category) => void
}

const pct = (n: number) => `${Math.round(n * 100)}%`

export function CategoriesPage({ onEdit }: CategoriesPageProps) {
  const categories = useInventoryStore((s) => s.categories)
  const items      = useInventoryStore((s) => s.items)

  const stats: CategoryStats[] = useMemo(() => categories.map((c) => {
    const own = items.filter((i) => i.category === c.id)
    return {
      ...c,
      items:  own.length,
      units:  own.reduce((s, i) => s + (i.qty || 0), 0),
      alerts: own.filter((i) => i.status !== 'in').length,
    }
  }), [categories, items])

  const totalItems = Math.max(1, items.length)
  const maxItems   = Math.max(1, ...stats.map((c) => c.items))
  const populated  = stats.filter((c) => c.items > 0).sort((a, b) => b.items - a.items)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="inv-cat-layout">
        <Card padding="none">
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Where it lives</h3>
          </div>
          <div style={{ padding: '20px 18px' }}>
            <div className="inv-cat-stack">
              {populated.map((c) => (
                <span key={c.id} title={`${c.label} · ${c.items}`} style={{ flex: c.items, background: catDot(c.hue) }} />
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="mono" style={{ fontSize: 9.5, color: 'var(--fg-4)', letterSpacing: '.1em' }}>CATEGORIES</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{categories.length}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 9.5, color: 'var(--fg-4)', letterSpacing: '.1em' }}>ITEMS</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{items.length}</div>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {populated.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: catDot(c.hue), flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1 }}>{c.label}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{pct(c.items / totalItems)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card padding="none">
          <div style={{ padding: '16px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Categories</h3>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>click to edit</span>
          </div>
          <div style={{ padding: '8px 18px 16px' }}>
            {stats.map((c) => (
              <div key={c.id} className="inv-cat-row">
                <span className="inv-cat-glyph" style={{ background: catBg(c.hue), borderColor: catBorder(c.hue), color: catFg(c.hue) }}>
                  {c.short.slice(0, 3)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 2 }}>
                    {c.items} items · {c.units} units · low ≤ {c.lowThreshold}
                    {c.alerts > 0 && <span style={{ color: 'var(--warn)' }}> · {c.alerts} low/out</span>}
                  </div>
                </div>
                <div className="inv-cat-share">
                  <div className="inv-cat-track">
                    <div className="inv-cat-fill" style={{ width: `${(c.items / maxItems) * 100}%`, background: catDot(c.hue) }} />
                  </div>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', width: 34, textAlign: 'right' }}>
                    {pct(c.items / totalItems)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="inv-cat-edit" onClick={() => onEdit(c)} title="Edit category">
                    <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{c.short}</span>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--fg-4)' }}>
                      <path d="M11 2.5l2.5 2.5L5 13.5H2.5V11z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <footer className="page-foot mono">
        <span>END · {categories.length} categories</span>
        <span className="dim">enclave/inventory · build 2026.05</span>
      </footer>
    </div>
  )
}
