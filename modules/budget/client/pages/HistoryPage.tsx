import { Card } from '@venator-ui/ui';
import { TrendingUp, Wallet, Star } from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import { computeMetrics, fmt, fmtSigned, pct } from '@/lib/utils';
import { TrendChart } from '@/components/budget/TrendChart';

export function HistoryPage() {
  const months      = useBudgetStore(s => s.months);
  const monthIndex  = useBudgetStore(s => s.monthIndex);
  const budgets     = useBudgetStore(s => s.budgets);
  const loading     = useBudgetStore(s => s.loading);
  const error       = useBudgetStore(s => s.error);
  const hydrated    = useBudgetStore(s => s.hydrated);
  const refetch     = useBudgetStore(s => s.refetch);
  const setMonthIndex = useBudgetStore(s => s.setMonthIndex);

  // ── 4 UI states ────────────────────────────────────────────────────────────

  if (loading && !hydrated) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>Loading history…</div>;
  }

  if (error && !hydrated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh' }}>
        <span style={{ color: 'var(--danger)' }}>Failed to load: {error}</span>
        <button className="btn btn-primary" onClick={() => void refetch()}>Retry</button>
      </div>
    );
  }

  const historyMonths = months.filter(m => m.created !== false);

  if (hydrated && historyMonths.length === 0) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>No history yet.</div>;
  }

  // ── Normal state ───────────────────────────────────────────────────────────

  const rows = historyMonths.map(m => {
    const mm = computeMetrics(m, budgets);
    return { m, ...mm, saved: m.income - mm.spent };
  });
  const activeHistoryIdx = historyMonths.findIndex(m => m.key === months[monthIndex]?.key);
  const selectHistoryMonth = (i: number) => {
    const key = historyMonths[i]?.key;
    const nextIndex = months.findIndex(m => m.key === key);
    if (nextIndex >= 0) void setMonthIndex(nextIndex);
  };

  const avgSpent   = Math.round(rows.reduce((s, r) => s + r.spent, 0) / rows.length);
  const totalSaved = rows.reduce((s, r) => s + r.saved, 0);
  const bestMonth  = rows.slice().sort((a, b) => b.saved - a.saved)[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><TrendingUp size={14} /></div><span className="stat-label">AVG. MONTHLY SPEND</span></div>
          <div className="stat-value mono">{fmt(avgSpent)}</div>
          <div className="stat-sub">Across the last {historyMonths.length} months</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><Wallet size={14} /></div><span className="stat-label">TOTAL SAVED</span></div>
          <div className="stat-value mono" style={{ color: totalSaved >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmtSigned(totalSaved)}</div>
          <div className="stat-sub">Income minus spending, {historyMonths.length} mo</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><Star size={14} /></div><span className="stat-label">BEST MONTH</span></div>
          <div className="stat-value mono">{bestMonth.m.label.slice(0, 3)}</div>
          <div className="stat-sub">Saved {fmt(bestMonth.saved)} · {bestMonth.m.year}</div>
        </div>
      </div>

      <Card padding="none">
        <div style={{ padding: '16px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Spending vs income</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-3)' }}><span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--accent)', display: 'inline-block' }} />Spent</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-3)' }}><span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--success)', display: 'inline-block' }} />Income</span>
          </div>
        </div>
        <div style={{ padding: '14px 18px 18px' }}>
          <TrendChart months={historyMonths} budgets={budgets} activeIdx={activeHistoryIdx} onSelect={selectHistoryMonth} />
        </div>
      </Card>

      <Card padding="none">
        <div style={{ padding: '16px 18px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Month by month</h3>
        </div>
        <div style={{ padding: '0 18px 16px' }}>
          <div className="hist-table" style={{ marginTop: 12 }}>
            <div className="hist-head mono"><span>MONTH</span><span style={{ textAlign: 'right' }}>INCOME</span><span style={{ textAlign: 'right' }}>SPENT</span><span style={{ textAlign: 'right' }}>SAVED</span><span>OF BUDGET</span></div>
            {rows.slice().reverse().map(r => {
              const active = r.m.key === months[monthIndex]?.key;
              return (
                <button key={r.m.key} type="button" className={`hist-row ${active ? 'active' : ''}`} onClick={() => void setMonthIndex(months.findIndex(x => x.key === r.m.key))}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600 }}>
                    {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
                    {r.m.label} {r.m.year}
                    {r.m.note && <span className="mono" style={{ fontSize: 9.5, color: 'var(--accent)', border: '1px solid var(--border-subtle)', padding: '1px 5px', borderRadius: 4 }}>{r.m.note}</span>}
                  </span>
                  <span className="mono" style={{ fontSize: 13, textAlign: 'right', color: 'var(--fg-2)' }}>{fmt(r.income)}</span>
                  <span className="mono" style={{ fontSize: 13, textAlign: 'right', fontWeight: 600, color: r.spent > r.totalBudget ? 'var(--danger)' : 'var(--fg)' }}>{fmt(r.spent)}</span>
                  <span className="mono" style={{ fontSize: 13, textAlign: 'right', fontWeight: 600, color: r.saved >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmtSigned(r.saved)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--gauge-track)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 100, background: r.spent > r.totalBudget ? 'var(--danger)' : 'var(--accent)', width: `${Math.min(100, (r.spent / r.totalBudget) * 100)}%`, transition: '0.4s ease' }} />
                    </div>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', width: 36 }}>{pct(r.spent / r.totalBudget)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <footer className="page-foot mono">
        <span>END · {historyMonths.length} months tracked</span>
        <span className="dim">enclave/budget · build 2026.05</span>
      </footer>
    </div>
  );
}
