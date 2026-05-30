import { useState } from 'react';
import { Card } from '@venator-ui/ui';
import { Check, Pencil } from 'lucide-react';
import { useBudgetStore, useCurrentMonth } from '@/store/budgetStore';
import { computeMetrics, fmt, pct } from '@/lib/utils';
import { DonutChart } from '@/components/budget/DonutChart';
import { CategoryGlyph } from '@/components/budget/CategoryGlyph';
import type { CategoryId } from '@/types/budget';

export function CategoriesPage() {
  const month = useCurrentMonth();
  const budgets = useBudgetStore(s => s.budgets);
  const setBudget = useBudgetStore(s => s.setBudget);
  const metrics = computeMetrics(month, budgets);

  const [editing, setEditing] = useState<CategoryId | null>(null);
  const [draft, setDraft] = useState('');

  const cats = [...metrics.cats].sort((a, b) => b.spent - a.spent);
  const allocated = cats.reduce((s, c) => s + c.budget, 0);

  const startEdit = (id: CategoryId, current: number) => {
    setEditing(id);
    setDraft(String(current));
  };

  const commitEdit = () => {
    if (!editing) return;
    const val = Math.max(0, parseInt(draft) || 0);
    setBudget(editing, val);
    setEditing(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>

        {/* donut + summary */}
        <Card padding="none">
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Where it goes</h3>
          </div>
          <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <DonutChart cats={cats} size={190} />
            <div style={{ width: '100%', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="mono" style={{ fontSize: 9.5, color: 'var(--fg-4)', letterSpacing: '.1em' }}>BUDGET</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{fmt(allocated)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 9.5, color: 'var(--fg-4)', letterSpacing: '.1em' }}>REMAINING</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: metrics.remaining >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {fmt(metrics.remaining)}
                </div>
              </div>
            </div>
            {/* legend */}
            <div style={{ width: '100%', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cats.filter(c => c.spent > 0).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1 }}>{c.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{pct(c.spent / metrics.spent)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* budget editor */}
        <Card padding="none">
          <div style={{ padding: '16px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Budgets by category</h3>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>click to edit</span>
          </div>
          <div style={{ padding: '8px 18px 16px' }}>
            {cats.map(c => {
              const isEd = editing === c.id;
              return (
                <div key={c.id} className="cat-editor-row">
                  <CategoryGlyph cat={c} size={34} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: c.ratio > 1 ? 'var(--danger)' : 'var(--fg-4)', marginTop: 2 }}>
                      {fmt(c.spent)} spent · {fmt(Math.abs(c.budget - c.spent))} {c.budget - c.spent >= 0 ? 'left' : 'over'}
                    </div>
                  </div>
                  {/* progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="prog-track" style={{ flex: 1 }}>
                      <div className="prog-fill" style={{ width: `${Math.min(100, c.ratio * 100)}%`, background: c.ratio > 1 ? 'var(--danger)' : c.color }} />
                    </div>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', width: 34, textAlign: 'right' }}>
                      {pct(c.ratio)}
                    </span>
                  </div>
                  {/* budget input or display */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    {isEd ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="budget-input-wrap">
                          <span style={{ color: 'var(--fg-4)', fontSize: 13 }}>$</span>
                          <input
                            autoFocus
                            type="number"
                            className="budget-input"
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitEdit();
                              if (e.key === 'Escape') setEditing(null);
                            }}
                          />
                        </div>
                        <button className="icon-btn" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={commitEdit}>
                          <Check size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="budget-display"
                        onClick={() => startEdit(c.id, c.budget)}
                      >
                        <span className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>{fmt(c.budget)}</span>
                        <Pencil size={12} style={{ color: 'var(--fg-4)' }} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <footer className="page-foot mono">
        <span>END · {cats.length} categories</span>
        <span className="dim">enclave/budget · build 2026.05</span>
      </footer>
    </div>
  );
}
