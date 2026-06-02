import { useState } from 'react';
import { Card } from '@venator-ui/ui';
import { List, Zap, Plus } from 'lucide-react';
import { useBudgetStore, useCurrentMonth } from '@/store/budgetStore';
import { fmt, fmt2 } from '@/lib/utils';
import { getTransactions, CATEGORIES } from '@/lib/seed';
import { CategoryGlyph } from '@/components/budget/CategoryGlyph';
import type { CategoryId } from '@/types/budget';

interface Props {
  onAddExpense: () => void;
}

export function ExpensesPage({ onAddExpense }: Props) {
  const recurring = useBudgetStore(s => s.recurring);
  const deleteExpense = useBudgetStore(s => s.deleteExpense);
  const month = useCurrentMonth();

  const [catFilter, setCatFilter] = useState<CategoryId | null>(null);
  const allTx = getTransactions(month, recurring);
  const shown = catFilter ? allTx.filter(t => t.cat === catFilter) : allTx;
  const manual = month.extra;
  const variableTotal = allTx.filter(t => !t.recurring).reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* stat tiles */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-head">
            <div className="stat-icon"><List size={14} /></div>
            <span className="stat-label">LOGGED THIS MONTH</span>
          </div>
          <div className="stat-value mono">{allTx.length}</div>
          <div className="stat-sub">{fmt(allTx.reduce((s, t) => s + t.amount, 0))} across all entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <div className="stat-icon"><Zap size={14} /></div>
            <span className="stat-label">VARIABLE SPENDING</span>
          </div>
          <div className="stat-value mono">{fmt(variableTotal)}</div>
          <div className="stat-sub">Excludes fixed recurring bills</div>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <div className="stat-icon"><Plus size={14} /></div>
            <span className="stat-label">ADDED BY YOU</span>
          </div>
          <div className="stat-value mono">{manual.length}</div>
          <div className="stat-sub">
            {manual.length > 0
              ? `${fmt(manual.reduce((s, t) => s + t.amount, 0))} in manual entries`
              : 'Log a purchase to get started'}
          </div>
        </div>
      </div>

      <Card padding="none">
        {/* header */}
        <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 2px' }}>All expenses</h3>
            <p className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', margin: 0 }}>
              {shown.length} shown · {fmt(shown.reduce((s, t) => s + t.amount, 0))}
            </p>
          </div>
          <button className="btn btn-primary" onClick={onAddExpense} style={{ gap: 7 }}>
            <Plus size={15} /> Add expense
          </button>
        </div>

        {/* category filter chips */}
        <div style={{ padding: '12px 18px 0' }}>
          <div className="chip-row">
            <button className={`filter-chip ${!catFilter ? 'active' : ''}`} style={!catFilter ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--fg)' } : undefined} onClick={() => setCatFilter(null)}>
              All
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`filter-chip ${catFilter === c.id ? 'active' : ''}`}
                style={catFilter === c.id ? { borderColor: c.color, background: c.color + '18', color: 'var(--fg)' } : undefined}
                onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}
              >
                <span className="filter-dot" style={{ background: c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* table */}
        <div style={{ padding: '0 18px 16px' }}>
          <div className="expense-table" style={{ marginTop: 12 }}>
            <div className="expense-head mono">
              <span />
              <span>EXPENSE</span>
              <span>CATEGORY</span>
              <span>DATE</span>
              <span style={{ textAlign: 'right' }}>AMOUNT</span>
              <span />
            </div>
            <div style={{ maxHeight: 'calc(100vh - 420px)', overflow: 'auto' }}>
              {shown.map((t) => {
                const cat = CATEGORIES.find(c => c.id === t.cat)!;
                return (
                  <div key={t.id} className="expense-row">
                    <CategoryGlyph cat={cat} size={28} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.name}
                        {t.recurring && <span className="tag tag-rec">AUTO</span>}
                        {t.manual && <span className="tag tag-new">NEW</span>}
                      </div>
                      <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', marginTop: 1 }}>{t.vendor || cat.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: cat.color, display: 'inline-block' }} />
                      {cat.name}
                    </div>
                    <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{month.label.slice(0, 3)} {t.day}</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>−{fmt2(t.amount)}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {t.manual ? (
                        <button
                          className="icon-btn danger"
                          title="Delete"
                          onClick={() => deleteExpense(t.id)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
                          </svg>
                        </button>
                      ) : <span style={{ width: 30 }} />}
                    </div>
                  </div>
                );
              })}
              {shown.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>
                  No expenses in this category yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <footer className="page-foot mono">
        <span>END · {shown.length} / {allTx.length} entries</span>
        <span className="dim">enclave/budget · build 2026.05</span>
      </footer>
    </div>
  );
}
