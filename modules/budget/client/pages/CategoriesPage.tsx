import { useState } from 'react';
import { Card } from '@venator-ui/ui';
import { Pencil } from 'lucide-react';
import { useBudgetStore, useCurrentMonth } from '@/store/budgetStore';
import { computeMetrics, fmt, pct } from '@/lib/utils';
import { DonutChart } from '@/components/budget/DonutChart';
import { CategoryGlyph } from '@/components/budget/CategoryGlyph';
import { AddCategoryModal } from '@/components/budget/AddCategoryModal';
import type { CategoryMetrics } from '@/types/budget';

export function CategoriesPage() {
  const month    = useCurrentMonth();
  const budgets  = useBudgetStore(s => s.budgets);
  const categories = useBudgetStore(s => s.categories);
  const updateCategory = useBudgetStore(s => s.updateCategory);
  const loading  = useBudgetStore(s => s.loading);
  const error    = useBudgetStore(s => s.error);
  const hydrated = useBudgetStore(s => s.hydrated);
  const refetch  = useBudgetStore(s => s.refetch);
  const metrics  = computeMetrics(month, budgets, categories);

  const [editCat, setEditCat]     = useState<CategoryMetrics | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // ── 4 UI states ────────────────────────────────────────────────────────────

  if (loading && !hydrated) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>Loading categories…</div>;
  }

  if (error && !hydrated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh' }}>
        <span style={{ color: 'var(--danger)' }}>Failed to load: {error}</span>
        <button className="btn btn-primary" onClick={() => void refetch()}>Retry</button>
      </div>
    );
  }

  // ── Normal state ───────────────────────────────────────────────────────────

  const cats      = [...metrics.cats].sort((a, b) => b.spent - a.spent);
  const allocated = cats.reduce((s, c) => s + c.budget, 0);

  const openEdit   = (c: CategoryMetrics) => { setEditError(null); setEditCat(c); };
  const commitEdit = async (cat: { name: string; color: string; icon: string; budget: number }) => {
    if (!editCat) return;
    setEditError(null);
    try {
      await updateCategory(editCat.id, cat);
      setEditCat(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
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
                <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: metrics.remaining >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(metrics.remaining)}</div>
              </div>
            </div>
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

        <Card padding="none">
          <div style={{ padding: '16px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Budgets by category</h3>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>click to edit</span>
          </div>
          <div style={{ padding: '8px 18px 16px' }}>
            {cats.map(c => (
              <div key={c.id} className="cat-editor-row">
                <CategoryGlyph cat={c} size={34} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: c.ratio > 1 ? 'var(--danger)' : 'var(--fg-4)', marginTop: 2 }}>
                    {fmt(c.spent)} spent · {fmt(Math.abs(c.budget - c.spent))} {c.budget - c.spent >= 0 ? 'left' : 'over'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="prog-track" style={{ flex: 1 }}>
                    <div className="prog-fill" style={{ width: `${Math.min(100, c.ratio * 100)}%`, background: c.ratio > 1 ? 'var(--danger)' : c.color }} />
                  </div>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', width: 34, textAlign: 'right' }}>{pct(c.ratio)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  <button className="budget-display" onClick={() => openEdit(c)} title="Edit category">
                    <span className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>{fmt(c.budget)}</span>
                    <Pencil size={12} style={{ color: 'var(--fg-4)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <footer className="page-foot mono">
        <span>END · {cats.length} categories</span>
        <span className="dim">enclave/budget · build 2026.05</span>
      </footer>

      {editCat && (
        <AddCategoryModal
          initial={{ name: editCat.name, color: editCat.color, icon: editCat.icon, budget: editCat.budget }}
          onClose={() => setEditCat(null)}
          onSave={cat => void commitEdit(cat)}
          error={editError}
        />
      )}
    </div>
  );
}
