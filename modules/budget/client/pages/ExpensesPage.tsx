import { useState, useEffect, useRef } from 'react';
import { Card } from '@venator-ui/ui';
import { List, Zap, Plus } from 'lucide-react';
import { useBudgetStore, useCurrentMonth } from '@/store/budgetStore';
import { useToast } from '@venator-ui/ui';
import { fmt, fmt2 } from '@/lib/utils';
import { CATEGORIES } from '@/lib/seed';
import { CategoryGlyph } from '@/components/budget/CategoryGlyph';
import { ConfirmDeleteModal } from '@/components/budget/ConfirmDeleteModal';
import type { CategoryId, Transaction } from '@/types/budget';

// ── ExpenseRow ────────────────────────────────────────────────────────────────

interface ExpenseRowProps {
  t: Transaction
  monthLabel: string
  onEdit: (tx: Transaction) => void
  onDelete: (id: string) => Promise<void>
}

function ExpenseRow({ t, monthLabel, onEdit, onDelete }: ExpenseRowProps) {
  const cat = CATEGORIES.find(c => c.id === t.cat)!;
  const [dropOpen, setDropOpen]       = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(t.id);
      setConfirmOpen(false);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Error deleting expense',
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="expense-row">
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
        <span style={{ width: 7, height: 7, borderRadius: 2, background: cat.color, display: 'inline-block' }} />{cat.name}
      </div>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{monthLabel.slice(0, 3)} {t.day}</div>
      <div className="mono" style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>−{fmt2(t.amount)}</div>

      {/* Actions — dropdown only for manual transactions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {t.manual ? (
          <div ref={dropRef} style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              title="More options"
              onClick={() => setDropOpen(o => !o)}
              style={{ width: 28, padding: 0, fontWeight: 700, fontSize: 15, letterSpacing: 1 }}
            >
              ···
            </button>

            {dropOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                minWidth: 110, zIndex: 10,
                background: 'var(--bg-2)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                padding: '4px 0',
              }}>
                <button
                  onClick={() => { setDropOpen(false); onEdit(t); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '8px 14px', textAlign: 'left',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: 'var(--fg-1)', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  Edit
                </button>
                <button
                  onClick={() => { setDropOpen(false); setConfirmOpen(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '8px 14px', textAlign: 'left',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: 'var(--danger)', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  Delete
                </button>
              </div>
            )}

            <ConfirmDeleteModal
              open={confirmOpen}
              itemName={t.name}
              title="Delete expense"
              loading={deleting}
              onConfirm={() => void handleConfirmDelete()}
              onCancel={() => setConfirmOpen(false)}
            />
          </div>
        ) : (
          <span style={{ width: 30 }} />
        )}
      </div>
    </div>
  );
}

// ── ExpensesPage ──────────────────────────────────────────────────────────────

interface Props {
  onAddExpense: () => void;
  onEditExpense: (tx: Transaction) => void;
}

export function ExpensesPage({ onAddExpense, onEditExpense }: Props) {
  const transactions  = useBudgetStore(s => s.transactions);
  const deleteExpense = useBudgetStore(s => s.deleteExpense);
  const loading       = useBudgetStore(s => s.loading);
  const error         = useBudgetStore(s => s.error);
  const hydrated      = useBudgetStore(s => s.hydrated);
  const refetch       = useBudgetStore(s => s.refetch);
  const month         = useCurrentMonth();

  const [catFilter, setCatFilter] = useState<CategoryId | null>(null);

  // ── 4 UI states ────────────────────────────────────────────────────────────

  if (loading && !hydrated) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>Loading expenses…</div>;
  }

  if (error && !hydrated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh' }}>
        <span style={{ color: 'var(--danger)' }}>Failed to load: {error}</span>
        <button className="btn btn-primary" onClick={() => void refetch()}>Retry</button>
      </div>
    );
  }

  if (hydrated && transactions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh', color: 'var(--fg-3)' }}>
        <span>No expenses this month.</span>
        <button className="btn btn-primary" onClick={onAddExpense}>+ Add your first expense</button>
      </div>
    );
  }

  // ── Normal state ───────────────────────────────────────────────────────────

  const shown         = catFilter ? transactions.filter(t => t.cat === catFilter) : transactions;
  const manual        = month.extra;
  const variableTotal = transactions.filter(t => !t.recurring).reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><List size={14} /></div><span className="stat-label">LOGGED THIS MONTH</span></div>
          <div className="stat-value mono">{transactions.length}</div>
          <div className="stat-sub">{fmt(transactions.reduce((s, t) => s + t.amount, 0))} across all entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><Zap size={14} /></div><span className="stat-label">VARIABLE SPENDING</span></div>
          <div className="stat-value mono">{fmt(variableTotal)}</div>
          <div className="stat-sub">Excludes fixed recurring bills</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><Plus size={14} /></div><span className="stat-label">ADDED BY YOU</span></div>
          <div className="stat-value mono">{manual.length}</div>
          <div className="stat-sub">
            {manual.length > 0
              ? `${fmt(manual.reduce((s, t) => s + t.amount, 0))} in manual entries`
              : 'Log a purchase to get started'}
          </div>
        </div>
      </div>

      <Card padding="none">
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 2px' }}>All expenses</h3>
          <p className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', margin: 0 }}>{shown.length} shown · {fmt(shown.reduce((s, t) => s + t.amount, 0))}</p>
        </div>

        <div style={{ padding: '12px 18px 0' }}>
          <div className="chip-row">
            <button className={`filter-chip ${!catFilter ? 'active' : ''}`} style={!catFilter ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--fg)' } : undefined} onClick={() => setCatFilter(null)}>All</button>
            {CATEGORIES.map(c => (
              <button key={c.id} className={`filter-chip ${catFilter === c.id ? 'active' : ''}`} style={catFilter === c.id ? { borderColor: c.color, background: c.color + '18', color: 'var(--fg)' } : undefined} onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}>
                <span className="filter-dot" style={{ background: c.color }} />{c.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 18px 16px' }}>
          <div className="expense-table" style={{ marginTop: 12 }}>
            <div className="expense-head mono"><span /><span>EXPENSE</span><span>CATEGORY</span><span>DATE</span><span style={{ textAlign: 'right' }}>AMOUNT</span><span /></div>
            <div style={{ maxHeight: 'calc(100vh - 420px)', overflow: 'auto' }}>
              {shown.map(t => (
                <ExpenseRow
                  key={t.id}
                  t={t}
                  monthLabel={month.label}
                  onEdit={onEditExpense}
                  onDelete={deleteExpense}
                />
              ))}
              {shown.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>No expenses in this category yet.</div>}
            </div>
          </div>
        </div>
      </Card>

      <footer className="page-foot mono">
        <span>END · {shown.length} / {transactions.length} entries</span>
        <span className="dim">enclave/budget · build 2026.05</span>
      </footer>
    </div>
  );
}
