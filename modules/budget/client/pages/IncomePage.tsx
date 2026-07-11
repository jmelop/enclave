import { useState, useEffect, useRef } from 'react';
import { Card } from '@venator-ui/ui';
import { HandCoins, Star, TrendingUp } from 'lucide-react';
import { useBudgetStore, useCurrentMonth } from '@/store/budgetStore';
import { useToast } from '@venator-ui/ui';
import { computeMetrics, fmt, fmt2, fmtSigned } from '@/lib/utils';
import { ConfirmDeleteModal } from '@/components/budget/ConfirmDeleteModal';
import { CreateMonthGate } from '@/components/budget/CreateMonthGate';
import type { IncomeEntry } from '@/types/budget';

// ── IncomeRow ─────────────────────────────────────────────────────────────────

interface IncomeRowProps {
  e: IncomeEntry
  monthLabel: string
  onEdit: (entry: IncomeEntry) => void
  onDelete: (id: string) => Promise<void>
}

function IncomeRow({ e, monthLabel, onEdit, onDelete }: IncomeRowProps) {
  const [dropOpen, setDropOpen]       = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!dropOpen) return;
    const handler = (ev: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(ev.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(e.id);
      setConfirmOpen(false);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Error deleting income',
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="income-row">
      <div style={{
        width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'color-mix(in srgb, var(--success) 14%, transparent)', color: 'var(--success)',
      }}>
        <HandCoins size={15} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {e.name}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', marginTop: 1 }}>{e.source || 'Income'}</div>
      </div>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{monthLabel.slice(0, 3)} {e.day}</div>
      <div className="mono" style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', color: 'var(--success)' }}>+{fmt2(e.amount)}</div>

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
                onClick={() => { setDropOpen(false); onEdit(e); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '8px 14px', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: 'var(--fg-1)', transition: 'background 0.12s',
                }}
                onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--bg-3)')}
                onMouseLeave={ev => (ev.currentTarget.style.background = 'none')}
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
                onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--bg-3)')}
                onMouseLeave={ev => (ev.currentTarget.style.background = 'none')}
              >
                Delete
              </button>
            </div>
          )}

          <ConfirmDeleteModal
            open={confirmOpen}
            itemName={e.name}
            title="Delete income"
            loading={deleting}
            onConfirm={() => void handleConfirmDelete()}
            onCancel={() => setConfirmOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}

// ── IncomePage ────────────────────────────────────────────────────────────────

interface Props {
  onAddIncome: () => void;
  onEditIncome: (entry: IncomeEntry) => void;
}

export function IncomePage({ onAddIncome, onEditIncome }: Props) {
  const incomes      = useBudgetStore(s => s.incomes);
  const deleteIncome = useBudgetStore(s => s.deleteIncome);
  const budgets      = useBudgetStore(s => s.budgets);
  const loading      = useBudgetStore(s => s.loading);
  const error        = useBudgetStore(s => s.error);
  const hydrated     = useBudgetStore(s => s.hydrated);
  const refetch      = useBudgetStore(s => s.refetch);
  const month        = useCurrentMonth();

  // ── 4 UI states ────────────────────────────────────────────────────────────

  if (loading && !hydrated) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>Loading income…</div>;
  }

  if (error && !hydrated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh' }}>
        <span style={{ color: 'var(--danger)' }}>Failed to load: {error}</span>
        <button className="btn btn-primary" onClick={() => void refetch()}>Retry</button>
      </div>
    );
  }

  if (incomes.length === 0) {
    const emptyState = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh', color: 'var(--fg-3)' }}>
        <span>No income logged this month.</span>
        <button className="btn btn-primary" onClick={onAddIncome}>+ Add your first income</button>
      </div>
    );

    return month.created === false ? <CreateMonthGate>{emptyState}</CreateMonthGate> : emptyState;
  }

  // ── Normal state ───────────────────────────────────────────────────────────

  const total   = incomes.reduce((s, e) => s + e.amount, 0);
  const biggest = incomes.slice().sort((a, b) => b.amount - a.amount)[0];
  const spent   = computeMetrics(month, budgets).spent;
  const saved   = total - spent;

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><HandCoins size={14} /></div><span className="stat-label">TOTAL THIS MONTH</span></div>
          <div className="stat-value mono" style={{ color: 'var(--success)' }}>{fmt(total)}</div>
          <div className="stat-sub">{incomes.length} income {incomes.length === 1 ? 'entry' : 'entries'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><Star size={14} /></div><span className="stat-label">BIGGEST ENTRY</span></div>
          <div className="stat-value mono">{fmt(biggest.amount)}</div>
          <div className="stat-sub">{biggest.name}{biggest.source ? ` · ${biggest.source}` : ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><TrendingUp size={14} /></div><span className="stat-label">SAVED THIS MONTH</span></div>
          <div className="stat-value mono" style={{ color: saved >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmtSigned(saved)}</div>
          <div className="stat-sub">Income {fmt(total)} − spent {fmt(spent)}</div>
        </div>
      </div>

      <Card padding="none">
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 2px' }}>All income</h3>
            <p className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', margin: 0 }}>{incomes.length} shown · {fmt(total)}</p>
          </div>
        </div>

        <div style={{ padding: '12px 18px 16px' }}>
          <div className="income-table">
            <div className="income-head mono"><span /><span>INCOME</span><span>DATE</span><span style={{ textAlign: 'right' }}>AMOUNT</span><span /></div>
            <div style={{ maxHeight: 'calc(100vh - 420px)', overflow: 'auto' }}>
              {incomes.map(e => (
                <IncomeRow
                  key={e.id}
                  e={e}
                  monthLabel={month.label}
                  onEdit={onEditIncome}
                  onDelete={deleteIncome}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <footer className="page-foot mono">
        <span>END · {incomes.length} income entries</span>
        <span className="dim">enclave/budget · build 2026.05</span>
      </footer>
    </div>
  );

  return month.created === false ? <CreateMonthGate>{content}</CreateMonthGate> : content;
}
