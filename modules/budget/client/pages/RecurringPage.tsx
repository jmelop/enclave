import { useState, useEffect, useRef } from 'react';
import { Card } from '@venator-ui/ui';
import { useToast } from '@venator-ui/ui';
import { CalendarDays, Shield } from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import { catOf, fmt, fmt2 } from '@/lib/utils';
import { CategoryGlyph } from '@/components/budget/CategoryGlyph';
import { RecurringModal } from '@/components/budget/RecurringModal';
import { ConfirmDeleteModal } from '@/components/budget/ConfirmDeleteModal';
import type { Category, RecurringBill } from '@/types/budget';

// ── RecurringRow ──────────────────────────────────────────────────────────────

interface RecurringRowProps {
  r: RecurringBill
  categories: Category[]
  onEdit: (r: RecurringBill) => void
  onDelete: (id: string) => Promise<void>
}

function RecurringRow({ r, categories, onEdit, onDelete }: RecurringRowProps) {
  const cat = catOf(categories, r.cat);
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
      await onDelete(r.id);
      setConfirmOpen(false);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Error deleting recurring bill',
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rec-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <CategoryGlyph cat={cat} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.vendor}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--fg-2)' }}>
        <span style={{ width: 7, height: 7, borderRadius: 2, background: cat.color, display: 'inline-block' }} />{cat.name}
      </div>
      <div className="mono" style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>Day {r.day}</div>
      <div className="mono" style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right' }}>
        {fmt2(r.amount)}{r.variable && <span style={{ color: 'var(--fg-4)', fontWeight: 400 }}>*</span>}
      </div>

      {/* Dropdown ··· */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                onClick={() => { setDropOpen(false); onEdit(r); }}
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
            itemName={r.name}
            title="Delete recurring bill"
            loading={deleting}
            onConfirm={() => void handleConfirmDelete()}
            onCancel={() => setConfirmOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}

// ── RecurringPage ─────────────────────────────────────────────────────────────

export function RecurringPage() {
  const recurring       = useBudgetStore(s => s.recurring);
  const categories      = useBudgetStore(s => s.categories);
  const updateRecurring = useBudgetStore(s => s.updateRecurring);
  const deleteRecurring = useBudgetStore(s => s.deleteRecurring);
  const loading         = useBudgetStore(s => s.loading);
  const error           = useBudgetStore(s => s.error);
  const hydrated        = useBudgetStore(s => s.hydrated);
  const refetch         = useBudgetStore(s => s.refetch);

  const [modal, setModal] = useState<{ initial?: RecurringBill } | null>(null);

  // ── 4 UI states ────────────────────────────────────────────────────────────

  if (loading && !hydrated) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>Loading recurring bills…</div>;
  }

  if (error && !hydrated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh' }}>
        <span style={{ color: 'var(--danger)' }}>Failed to load: {error}</span>
        <button className="btn btn-primary" onClick={() => void refetch()}>Retry</button>
      </div>
    );
  }

  // ── Normal state (including empty) ────────────────────────────────────────

  const total   = recurring.reduce((s, r) => s + r.amount, 0);
  const sorted  = [...recurring].sort((a, b) => a.day - b.day);
  const largest = sorted.slice().sort((a, b) => b.amount - a.amount)[0];

  const handleSave = (r: Omit<RecurringBill, 'id'> & { id?: string }) => {
    if (r.id) void updateRecurring(r as RecurringBill);
    setModal(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><CalendarDays size={14} /></div><span className="stat-label">MONTHLY FIXED</span></div>
          <div className="stat-value mono">{fmt(total)}</div>
          <div className="stat-sub">{recurring.length} active subscriptions & bills</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><CalendarDays size={14} /></div><span className="stat-label">ANNUAL COMMITMENT</span></div>
          <div className="stat-value mono">{fmt(total * 12)}</div>
          <div className="stat-sub">Locked-in spending per year</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><Shield size={14} /></div><span className="stat-label">LARGEST BILL</span></div>
          <div className="stat-value mono">{largest ? fmt(largest.amount) : '—'}</div>
          <div className="stat-sub">{largest?.name ?? 'No recurring bills'}</div>
        </div>
      </div>

      <Card padding="none">
        <div style={{ padding: '16px 18px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Recurring expenses</h3>
        </div>

        {sorted.length > 0 && (
          <div style={{ padding: '16px 22px 0' }}>
            <div className="rec-timeline">
              <div className="rec-timeline-track" />
              {sorted.map(r => {
                const cat = catOf(categories, r.cat);
                return <div key={r.id} className="rec-dot" style={{ left: `calc(${(r.day / 31) * 100}% - 9px)`, background: cat.color }} title={`${r.name} · day ${r.day}`} />;
              })}
              <span className="mono" style={{ position: 'absolute', bottom: 0, left: 0, fontSize: 9, color: 'var(--fg-4)' }}>1</span>
              <span className="mono" style={{ position: 'absolute', bottom: 0, right: 0, fontSize: 9, color: 'var(--fg-4)' }}>31</span>
            </div>
          </div>
        )}

        <div style={{ padding: '8px 18px 16px' }}>
          {sorted.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--fg-4)', fontSize: 13 }}>
              No recurring bills yet. Add one to track monthly fixed costs.
            </div>
          ) : (
            <div className="rec-table">
              <div className="rec-head mono"><span>SERVICE</span><span>CATEGORY</span><span>BILLS ON</span><span style={{ textAlign: 'right' }}>AMOUNT</span><span /></div>
              {sorted.map(r => (
                <RecurringRow
                  key={r.id}
                  r={r}
                  categories={categories}
                  onEdit={r => setModal({ initial: r })}
                  onDelete={deleteRecurring}
                />
              ))}
            </div>
          )}
          {sorted.length > 0 && <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', marginTop: 10 }}>* variable amount — estimated from recent bills</div>}
        </div>
      </Card>

      <footer className="page-foot mono">
        <span>END · {recurring.length} recurring entries</span>
        <span className="dim">enclave/budget · build 2026.05</span>
      </footer>

      {modal && (
        <RecurringModal
          initial={modal.initial}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
