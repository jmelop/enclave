import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@venator-ui/patterns';
import { Card, Separator } from '@venator-ui/ui';
import { Dumbbell, Scale, Flame, TrendingUp, TrendingDown } from 'lucide-react';
import LineChart from '../components/LineChart';
import { FreshnessChips, TrendChips } from '../components/FreshnessChips';
import { useWorkoutStore } from '../store/workoutStore';
import { formatDate, dayOfWeek } from '../lib/workoutUtils';

const NO_DATA = 'no data yet';

// Signed count/percentage helpers — a comparison against an empty prior period
// is meaningless, so these return null rather than a misleading 0 or Infinity.
function signedCount(current: number, previous: number | null): string | null {
  if (previous == null) return null;
  const diff = current - previous;
  return `${diff > 0 ? '+' : ''}${diff} vs last month`;
}

function signedPct(current: number, previous: number | null): string | null {
  if (previous == null || previous === 0) return null;
  const diff = Math.round(((current - previous) / previous) * 100);
  return `${diff > 0 ? '+' : ''}${diff}% vs last week`;
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const { sessions, summary: w } = useWorkoutStore(s => s.workouts);
  const { entries, trend, summary } = useWorkoutStore(s => s.body);

  const m = useMemo(() => {
    const latest = entries[entries.length - 1];
    return {
      sessionsMonth: w.sessionsThisMonth,
      sessionsLastMonth: w.sessionsLastMonth,
      latestWeight: latest?.weight ?? null,
      weightDelta: summary.totalDelta,
      spanDays: summary.spanDays,
      streak: w.currentStreak,
      volWeek: w.volumeThisWeek,
      volPrev: w.volumeLastWeek,
      topSet: w.topSetThisWeek,
      frequent: w.mostFrequentExercise,
      daysSinceLast: summary.daysSinceSession,
    };
  }, [w, entries, summary]);

  // Overview shows the trend line only — the full three-series view lives on Body.
  const chart = useMemo(() => {
    const recent = trend.slice(-8);
    return {
      labels: recent.map(t => formatDate(t.date, { short: true })),
      series: [
        {
          key: 'raw', label: 'weight (raw)', unit: 'kg',
          values: recent.map(t => t.weight),
          color: 'var(--accent)', opacity: 0.25, width: 1.5, dots: false,
        },
        {
          key: 'ma7', label: '7-day average', unit: 'kg',
          values: recent.map(t => t.ma7),
          color: 'var(--accent)', width: 2.5, gaps: 'break' as const,
          dashed: recent.map(t => t.ma7Partial),
        },
      ],
    };
  }, [trend]);

  const recentSessions = sessions.slice(0, 4);

  const weightDeltaLabel = m.weightDelta == null
    ? null
    : `${m.weightDelta > 0 ? '+' : ''}${m.weightDelta.toFixed(1)} kg`;

  const spanLabel = m.spanDays == null
    ? NO_DATA
    : `${weightDeltaLabel} over ${Math.max(1, Math.round(m.spanDays / 7))} weeks`;

  return (
    <>
      {/* Freshness — on the landing page, where it can remind before logging */}
      <div className="flex items-center justify-end gap-2 flex-wrap mb-3">
        <TrendChips weeklyDelta={summary.weeklyDelta} waistPerKg={summary.waistPerKg} />
        <FreshnessChips
          daysSinceWeight={summary.daysSinceWeight}
          daysSinceWaist={summary.daysSinceWaist}
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard
          title="Sessions this month"
          icon={<Dumbbell size={14} />}
          value={<span className="font-mono">{m.sessionsMonth}</span>}
          description={signedCount(m.sessionsMonth, m.sessionsLastMonth) ?? NO_DATA}
        />
        <StatCard
          title="Current weight"
          icon={<Scale size={14} />}
          value={
            m.latestWeight == null
              ? <span className="text-fg-4">—</span>
              : <span className="font-mono">{m.latestWeight.toFixed(1)} <span className="text-lg text-fg-4 font-medium">kg</span></span>
          }
          description={spanLabel}
        />
        <StatCard
          title="Current streak"
          icon={<Flame size={14} />}
          value={<span className="font-mono">{m.streak} <span className="text-lg text-fg-4 font-medium">wk</span></span>}
          description={m.streak > 0 ? `${m.streak} weeks with a session` : NO_DATA}
        />
        <StatCard
          title="Volume this week"
          icon={<TrendingUp size={14} />}
          value={<span className="font-mono">{m.volWeek.toLocaleString()} <span className="text-lg text-fg-4 font-medium">kg</span></span>}
          description={signedPct(m.volWeek, m.volPrev) ?? NO_DATA}
        />
      </div>

      {/* Two-column grid */}
      <div
        className="grid gap-4 mb-4"
        style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}
      >
        {/* Weight chart */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-[13px] font-semibold text-fg-2 m-0">Body weight</h3>
              <span className="text-[11px] text-fg-4">Last 8 measurements</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-fg-4">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--accent)' }} />
              <span className="font-mono">7-day average · kg</span>
            </div>
          </div>
          <div className="p-[18px]">
            <LineChart labels={chart.labels} series={chart.series} height={240} />
          </div>
        </Card>

        {/* Recent sessions */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[var(--border-subtle)]">
            <h3 className="text-[13px] font-semibold text-fg-2 m-0">Recent sessions</h3>
            <button
              onClick={() => navigate('/workouts')}
              className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--border-subtle)] bg-bg-2 text-fg-3 font-medium cursor-pointer hover:border-[var(--border-default)] transition-colors"
            >
              View all →
            </button>
          </div>
          <div>
            {recentSessions.length === 0 && (
              <div className="px-[18px] py-6 text-center text-fg-4 text-[12px]">
                No sessions logged yet
              </div>
            )}
            {recentSessions.map(w => {
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between px-[18px] py-3 border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-bg-2 transition-colors"
                >
                  <div className="flex flex-col gap-[3px] min-w-0">
                    <span className="font-mono text-[11px] text-fg-4 tracking-[0.4px]">
                      {dayOfWeek(w.date).toUpperCase()} · {formatDate(w.date, { short: true })}
                    </span>
                    <span className="text-[13px] text-fg font-medium">{w.name}</span>
                    <span className="text-[11px] text-fg-4">
                      {w.exercises.length} exercises · {w.setCount} sets
                    </span>
                  </div>
                  <span
                    className="inline-flex items-center font-mono font-medium text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap ml-3"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    {w.volume.toLocaleString()} kg
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Three info cards */}
      <div className="grid grid-cols-3 gap-3">
        <MiniInfoCard
          title="Top weight this week"
          value={m.topSet ? String(m.topSet.kg) : '—'}
          unit={m.topSet ? 'kg' : undefined}
          label={m.topSet ? `${m.topSet.exercise} · ${m.topSet.reps} reps` : NO_DATA}
          mono
        />
        <MiniInfoCard
          title="Most frequent exercise"
          value={m.frequent ? m.frequent.name : '—'}
          label={m.frequent ? `${m.frequent.count} sessions this month` : NO_DATA}
        />
        <MiniInfoCard
          title="Days since last session"
          value={m.daysSinceLast == null ? '—' : String(m.daysSinceLast)}
          unit={m.daysSinceLast == null ? undefined : 'd'}
          label={sessions[0] ? sessions[0].name : NO_DATA}
          mono
        />
      </div>

      {/* Delta indicators row */}
      <div className="grid grid-cols-4 gap-3 mt-3">
        {m.sessionsLastMonth != null && (
          <div className={`flex items-center gap-1.5 text-[11px] ${m.sessionsMonth >= m.sessionsLastMonth ? 'text-success' : 'text-danger'}`}>
            {m.sessionsMonth >= m.sessionsLastMonth ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="font-mono">{signedCount(m.sessionsMonth, m.sessionsLastMonth)}</span>
          </div>
        )}
        {weightDeltaLabel && (
          <div className={`flex items-center gap-1.5 text-[11px] ${m.weightDelta! <= 0 ? 'text-success' : 'text-warn'}`}>
            {m.weightDelta! <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            <span className="font-mono">{weightDeltaLabel} total</span>
          </div>
        )}
      </div>
    </>
  );
}

function MiniInfoCard({
  title, value, unit, label, mono = false,
}: {
  title: string;
  value: string;
  unit?: string;
  label: string;
  mono?: boolean;
}) {
  return (
    <Card padding="none">
      <div className="p-[18px] flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.8px] text-fg-4 font-semibold">{title}</span>
        <span
          className="text-[20px] font-semibold text-fg tracking-[-0.3px]"
          style={mono ? { fontFamily: 'JetBrains Mono, monospace' } : undefined}
        >
          {value}
          {unit && <span className="text-xs text-fg-3 ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>{unit}</span>}
        </span>
        <span className="text-[11px] text-fg-4">{label}</span>
      </div>
    </Card>
  );
}
