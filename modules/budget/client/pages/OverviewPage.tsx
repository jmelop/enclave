import { useState } from 'react';
import { Card } from '@venator-ui/ui';
import { Zap, TrendingUp, Wallet, Target } from 'lucide-react';
import { useBudgetStore, useCurrentMonth } from '@/store/budgetStore';
import { computeMetrics, fmt, fmt2, fmtSigned, pct } from '@/lib/utils';
import { CATEGORIES } from '@/lib/seed';
import { SpendingGauge } from '@/components/budget/SpendingGauge';
import { TrendChart } from '@/components/budget/TrendChart';
import { CategoryGlyph } from '@/components/budget/CategoryGlyph';
import { CreateMonthGate } from '@/components/budget/CreateMonthGate';
import type { CategoryId } from '@/types/budget';

interface Props {
  onAddExpense: () => void;
}

export function OverviewPage({ onAddExpense }: Props) {
  const months       = useBudgetStore(s => s.months);
  const monthIndex   = useBudgetStore(s => s.monthIndex);
  const budgets      = useBudgetStore(s => s.budgets);
  const recurring    = useBudgetStore(s => s.recurring);
  const transactions = useBudgetStore(s => s.transactions);
  const loading      = useBudgetStore(s => s.loading);
  const error        = useBudgetStore(s => s.error);
  const hydrated     = useBudgetStore(s => s.hydrated);
  const refetch      = useBudgetStore(s => s.refetch);
  const setMonthIndex = useBudgetStore(s => s.setMonthIndex);
  const month        = useCurrentMonth();

  const [catFilter, setCatFilter] = useState<CategoryId | null>(null);

  // ── 4 UI states ────────────────────────────────────────────────────────────

  if (loading && !hydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>
        Loading budget…
      </div>
    );
  }

  if (error && !hydrated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh' }}>
        <span style={{ color: 'var(--danger)' }}>Failed to load: {error}</span>
        <button className="btn btn-primary" onClick={() => void refetch()}>Retry</button>
      </div>
    );
  }

  if (hydrated && months.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh', color: 'var(--fg-3)' }}>
        <span>No budget data yet.</span>
        <button className="btn btn-primary" onClick={onAddExpense}>+ Add your first expense</button>
      </div>
    );
  }

  // ── Normal state ───────────────────────────────────────────────────────────

  const allTx    = catFilter ? transactions.filter(t => t.cat === catFilter) : transactions;
  const shownTx  = allTx;
  const metrics  = computeMetrics(month, budgets);
  const prev     = monthIndex > 0 ? computeMetrics(months[monthIndex - 1], budgets) : null;
  const upcoming = recurring.filter(r => r.day > month.asOfDay).sort((a, b) => a.day - b.day);
  const m        = metrics;
  const over     = (m.inProgress ? m.projected : m.spent) > m.totalBudget;
  const projDelta = prev ? (m.projected - prev.spent) / prev.spent : 0;
  const catsSorted = [...m.cats].sort((a, b) => b.spent - a.spent);

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Hero */}
      <div className="overview-hero">
        <div className="gauge-card">
          <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>This month</h3>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 0, borderTop: '2px dashed var(--fg-4)', display: 'inline-block' }} /> projected
            </span>
          </div>
          <SpendingGauge metrics={m} size={220} />
          <div className="gauge-legend">
            {catsSorted.slice(0, 4).map(c => (
              <div key={c.id} className="gauge-legend-item">
                <span className="gauge-legend-dot" style={{ background: c.color }} />
                {c.name}
              </div>
            ))}
          </div>
        </div>

        <div className="safe-card">
          <div className="safe-label"><Zap size={13} />Safe to spend today</div>
          <div className="safe-amount" style={{ color: m.inProgress ? 'var(--accent)' : 'var(--fg-3)' }}>
            {m.inProgress ? fmt(m.safeToSpend) : fmt(0)}
          </div>
          <div className="safe-sub">
            {m.inProgress
              ? <><strong>{m.daysRemaining} days</strong> remaining · {fmt(m.remaining)} left</>
              : 'Month is closed out.'}
          </div>
          <div className="safe-mini-row">
            <div className="safe-mini"><span className="safe-mini-label">Spent</span><span className="safe-mini-val">{fmt(m.spent)}</span></div>
            <div className="safe-mini"><span className="safe-mini-label">Projected</span><span className="safe-mini-val" style={{ color: over ? 'var(--danger)' : 'var(--fg)' }}>{fmt(m.inProgress ? m.projected : m.spent)}</span></div>
            <div className="safe-mini"><span className="safe-mini-label">Income</span><span className="safe-mini-val" style={{ color: 'var(--success)' }}>{fmt(m.income)}</span></div>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatTile icon={<Wallet size={14} />} label="Spent so far" value={fmt(m.spent)} sub={`${pct(m.pctOfBudget)} of ${fmt(m.totalBudget)} budget`} />
        <StatTile icon={<Target size={14} />} label="Projected" value={fmt(m.inProgress ? m.projected : m.spent)} valueColor={over ? 'var(--danger)' : undefined}
          sub={`${over ? 'Over' : 'Under'} budget by ${fmt(Math.abs(m.totalBudget - (m.inProgress ? m.projected : m.spent)))}`}
          trend={prev ? { dir: projDelta, label: pct(Math.abs(projDelta)) } : undefined} />
        <StatTile icon={<TrendingUp size={14} />} label="Saved this month" value={fmtSigned(m.income - m.spent)} valueColor={m.income - m.spent >= 0 ? 'var(--success)' : 'var(--danger)'}
          sub={`Income ${fmt(m.income)} · remaining ${fmt(m.remaining)}`} />
      </div>

      {/* Category list + recent transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, alignItems: 'start' }}>
        <Card padding="none">
          <div style={{ padding: '16px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Spending by category</h3>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{catFilter ? 'filtering · tap to clear' : 'tap to filter'}</span>
          </div>
          <div style={{ padding: '4px 12px 12px' }}>
            <div className="cat-list">
              {catsSorted.map(c => {
                const dim    = catFilter !== null && catFilter !== c.id;
                const active = catFilter === c.id;
                return (
                  <button key={c.id} type="button" className={`cat-row ${dim ? 'dim' : ''} ${active ? 'active' : ''}`} onClick={() => setCatFilter(active ? null : c.id)}>
                    <CategoryGlyph cat={c} size={32} />
                    <div className="cat-info">
                      <div className="cat-name-row">
                        <span className="cat-name">{c.name}</span>
                        <span className="cat-amounts">
                          <span style={{ color: c.ratio > 1 ? 'var(--danger)' : 'var(--fg)', fontWeight: 600 }}>{fmt(c.spent)}</span>
                          {' / '}{fmt(c.budget)}
                        </span>
                      </div>
                      <div className="prog-track">
                        <div className="prog-fill" style={{ width: `${Math.min(100, c.ratio * 100)}%`, background: c.ratio > 1 ? 'var(--danger)' : c.color }} />
                      </div>
                    </div>
                    <span className="cat-pct" style={{ color: c.ratio > 1 ? 'var(--danger)' : 'var(--fg-3)' }}>{pct(c.ratio)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card padding="none">
          <div style={{ padding: '16px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Recent activity</h3>
            {catFilter
              ? <button className="mono" style={{ fontSize: 10, color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }} onClick={() => setCatFilter(null)}>✕ {CATEGORIES.find(c => c.id === catFilter)?.name}</button>
              : <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{transactions.length} txns</span>}
          </div>
          <div style={{ padding: '0 14px 12px', maxHeight: 380, overflow: 'auto' }}>
            <div className="tx-list">
              {shownTx.slice(0, 20).map(t => {
                const cat = CATEGORIES.find(c => c.id === t.cat)!;
                return (
                  <div key={t.id} className="tx-row">
                    <CategoryGlyph cat={cat} size={30} />
                    <div style={{ minWidth: 0 }}>
                      <div className="tx-name">
                        {t.name}
                        {t.recurring && <span className="tag tag-rec">AUTO</span>}
                        {t.manual && <span className="tag tag-new">NEW</span>}
                      </div>
                      <div className="tx-sub">{cat.name} · {t.vendor || ''}</div>
                    </div>
                    <div>
                      <div className="tx-amount">−{fmt2(t.amount)}</div>
                      <div className="tx-date">{month.label.slice(0, 3).toUpperCase()} {t.day}</div>
                    </div>
                  </div>
                );
              })}
              {shownTx.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>No transactions</div>}
            </div>
          </div>
        </Card>
      </div>

      {/* Trend + upcoming bills */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, alignItems: 'start' }}>
        <Card padding="none">
          <div style={{ padding: '16px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Spending trend</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-3)' }}><span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--accent)', display: 'inline-block' }} />Spent</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-3)' }}><span style={{ width: 12, height: 2, background: 'var(--success)', display: 'inline-block' }} />Income</span>
            </div>
          </div>
          <div style={{ padding: '12px 16px 16px' }}>
            <TrendChart months={months} budgets={budgets} activeIdx={monthIndex} onSelect={i => void setMonthIndex(i)} compact />
          </div>
        </Card>

        <Card padding="none">
          <div style={{ padding: '16px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Upcoming bills</h3>
            <span className="mono" style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 600 }}>{fmt(upcoming.reduce((s, r) => s + r.amount, 0))}</span>
          </div>
          <div style={{ padding: '0 14px 12px' }}>
            {upcoming.length > 0 ? upcoming.map((r, i) => {
              const cat = CATEGORIES.find(c => c.id === r.cat)!;
              return (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '30px 1fr auto', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: i < upcoming.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <CategoryGlyph cat={cat} size={30} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>{month.label.slice(0, 3)} {r.day}</div>
                  </div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{fmt2(r.amount)}</div>
                </div>
              );
            }) : <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>All bills paid this month ✓</div>}
          </div>
        </Card>
      </div>

      <footer className="page-foot mono">
        <span>END · {month.label} {month.year} · {transactions.length} transactions</span>
        <span className="dim">enclave/budget · build 2026.05</span>
      </footer>
    </div>
  );

  return month.created === false ? <CreateMonthGate>{content}</CreateMonthGate> : content;
}

function StatTile({ icon, label, value, sub, valueColor, trend }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  valueColor?: string; trend?: { dir: number; label: string };
}) {
  return (
    <div className="stat-card">
      <div className="stat-head">
        <div className="stat-icon">{icon}</div>
        <span className="stat-label">{label.toUpperCase()}</span>
        {trend && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: trend.dir > 0 ? 'var(--danger)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: 2 }}>{trend.dir > 0 ? '↗' : '↘'} {trend.label}</span>}
      </div>
      <div className="stat-value mono" style={{ color: valueColor || 'var(--fg)', fontSize: 32 }}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}
