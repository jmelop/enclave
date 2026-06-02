import { useState } from 'react';
import { Card } from '@venator-ui/ui';
import { CalendarDays, Shield, Plus, Pencil, Trash2 } from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import { fmt, fmt2 } from '@/lib/utils';
import { CATEGORIES } from '@/lib/seed';
import { CategoryGlyph } from '@/components/budget/CategoryGlyph';
import { RecurringModal } from '@/components/budget/RecurringModal';
import type { RecurringBill } from '@/types/budget';

export function RecurringPage() {
  const recurring = useBudgetStore(s => s.recurring);
  const addRecurring = useBudgetStore(s => s.addRecurring);
  const updateRecurring = useBudgetStore(s => s.updateRecurring);
  const deleteRecurring = useBudgetStore(s => s.deleteRecurring);

  const [modal, setModal] = useState<{ initial?: RecurringBill } | null>(null);

  const total = recurring.reduce((s, r) => s + r.amount, 0);
  const sorted = [...recurring].sort((a, b) => a.day - b.day);
  const largest = sorted.slice().sort((a, b) => b.amount - a.amount)[0];

  const handleSave = (r: Omit<RecurringBill, 'id'> & { id?: string }) => {
    if (r.id) {
      updateRecurring(r as RecurringBill);
    } else {
      const { id: _id, ...rest } = r;
      addRecurring(rest);
    }
    setModal(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* stat tiles */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-head">
            <div className="stat-icon"><CalendarDays size={14} /></div>
            <span className="stat-label">MONTHLY FIXED</span>
          </div>
          <div className="stat-value mono">{fmt(total)}</div>
          <div className="stat-sub">{recurring.length} active subscriptions & bills</div>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <div className="stat-icon"><CalendarDays size={14} /></div>
            <span className="stat-label">ANNUAL COMMITMENT</span>
          </div>
          <div className="stat-value mono">{fmt(total * 12)}</div>
          <div className="stat-sub">Locked-in spending per year</div>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <div className="stat-icon"><Shield size={14} /></div>
            <span className="stat-label">LARGEST BILL</span>
          </div>
          <div className="stat-value mono">{largest ? fmt(largest.amount) : '—'}</div>
          <div className="stat-sub">{largest?.name ?? 'No recurring bills'}</div>
        </div>
      </div>

      <Card padding="none">
        <div style={{ padding: '16px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Recurring expenses</h3>
          <button className="btn" onClick={() => setModal({})}>
            <Plus size={15} /> Add recurring
          </button>
        </div>

        {/* billing timeline */}
        <div style={{ padding: '16px 22px 0' }}>
          <div className="rec-timeline">
            <div className="rec-timeline-track" />
            {sorted.map(r => {
              const cat = CATEGORIES.find(c => c.id === r.cat)!;
              return (
                <div
                  key={r.id}
                  className="rec-dot"
                  style={{ left: `calc(${(r.day / 31) * 100}% - 9px)`, background: cat.color }}
                  title={`${r.name} · day ${r.day}`}
                />
              );
            })}
            <span className="mono" style={{ position: 'absolute', bottom: 0, left: 0, fontSize: 9, color: 'var(--fg-4)' }}>1</span>
            <span className="mono" style={{ position: 'absolute', bottom: 0, right: 0, fontSize: 9, color: 'var(--fg-4)' }}>31</span>
          </div>
        </div>

        {/* table */}
        <div style={{ padding: '8px 18px 16px' }}>
          <div className="rec-table">
            <div className="rec-head mono">
              <span>SERVICE</span>
              <span>CATEGORY</span>
              <span>BILLS ON</span>
              <span style={{ textAlign: 'right' }}>AMOUNT</span>
              <span />
            </div>
            {sorted.map(r => {
              const cat = CATEGORIES.find(c => c.id === r.cat)!;
              return (
                <div key={r.id} className="rec-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <CategoryGlyph cat={cat} size={30} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.vendor}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--fg-2)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: cat.color, display: 'inline-block' }} />
                    {cat.name}
                  </div>
                  <div className="mono" style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>Day {r.day}</div>
                  <div className="mono" style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right' }}>
                    {fmt2(r.amount)}
                    {r.variable && <span style={{ color: 'var(--fg-4)', fontWeight: 400 }}>*</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="icon-btn" title="Edit" onClick={() => setModal({ initial: r })}><Pencil size={13} /></button>
                    <button className="icon-btn danger" title="Delete" onClick={() => deleteRecurring(r.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', marginTop: 10 }}>
            * variable amount — estimated from recent bills
          </div>
        </div>
      </Card>

      <footer className="page-foot mono">
        <span>END · {recurring.length} recurring entries</span>
        <span className="dim">enclave/budget · build 2026.05</span>
      </footer>

      {modal && (
        <RecurringModal
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
