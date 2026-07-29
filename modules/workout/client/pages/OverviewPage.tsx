import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@venator-ui/patterns';
import { Card, Separator } from '@venator-ui/ui';
import { Dumbbell, Scale, Flame, TrendingUp, TrendingDown } from 'lucide-react';
import LineChart from '../components/LineChart';
import { useWorkoutStore } from '../store/workoutStore';
import {
  workoutVolume, formatDate, dayOfWeek,
  currentStreak, sessionsThisMonth, volumeThisWeek,
} from '../lib/workoutUtils';
import type { WorkoutSession } from '../types/workout';

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

// ── Derived metrics ───────────────────────────────────────────────────────────
// PR 3 migration candidates: these derive from raw store data on the client.
// They move to workout/server/service.ts when the derived-metrics layer lands.

function monthOffsetKey(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function sessionsInMonthKey(sessions: WorkoutSession[], key: string): WorkoutSession[] {
  return sessions.filter(w => w.date.slice(0, 7) === key);
}

function weekStartOffset(offset: number): Date {
  const now = new Date();
  const dow = now.getDay() === 0 ? 7 : now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dow + 1 + offset * 7);
  start.setHours(0, 0, 0, 0);
  return start;
}

function volumeLastWeek(sessions: WorkoutSession[]): number {
  const start = weekStartOffset(-1);
  const end = weekStartOffset(0);
  return sessions
    .filter(w => {
      const d = new Date(w.date + 'T00:00:00');
      return d >= start && d < end;
    })
    .reduce((sum, w) => sum + workoutVolume(w), 0);
}

interface TopSet { kg: number; reps: number; exercise: string }

function topSetThisWeek(sessions: WorkoutSession[]): TopSet | null {
  const start = weekStartOffset(0);
  let best: TopSet | null = null;
  for (const w of sessions) {
    if (new Date(w.date + 'T00:00:00') < start) continue;
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (!best || s.kg > best.kg) best = { kg: s.kg, reps: s.reps, exercise: ex.name };
      }
    }
  }
  return best;
}

function mostFrequentExercise(sessions: WorkoutSession[]): { name: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const w of sessions)
    for (const ex of w.exercises)
      counts.set(ex.name, (counts.get(ex.name) ?? 0) + 1);

  let best: { name: string; count: number } | null = null;
  for (const [name, count] of counts)
    if (!best || count > best.count) best = { name, count };
  return best;
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const sessions = useWorkoutStore(s => s.sessions);
  const { entries, trend, summary } = useWorkoutStore(s => s.body);

  const m = useMemo(() => {
    const thisMonthKey = monthOffsetKey(0);
    const lastMonthKey = monthOffsetKey(-1);
    const lastMonthSessions = sessionsInMonthKey(sessions, lastMonthKey);

    const latest = entries[entries.length - 1];
    const volWeek = volumeThisWeek(sessions);
    const volPrev = sessions.length > 0 ? volumeLastWeek(sessions) : null;

    return {
      sessionsMonth: sessionsThisMonth(sessions),
      sessionsLastMonth: sessions.length > 0 ? lastMonthSessions.length : null,
      thisMonthKey,
      latestWeight: latest?.weight ?? null,
      weightDelta: summary.totalDelta,
      spanDays: summary.spanDays,
      streak: currentStreak(sessions),
      volWeek,
      volPrev,
      topSet: topSetThisWeek(sessions),
      frequent: mostFrequentExercise(sessionsInMonthKey(sessions, thisMonthKey)),
      daysSinceLast: summary.daysSinceSession,
    };
  }, [sessions, entries, summary]);

  const chartData = useMemo(() => (
    trend.slice(-8).map(t => ({ label: formatDate(t.date, { short: true }), y: t.weight }))
  ), [trend]);

  const recentSessions = sessions.slice(0, 4);

  const weightDeltaLabel = m.weightDelta == null
    ? null
    : `${m.weightDelta > 0 ? '+' : ''}${m.weightDelta.toFixed(1)} kg`;

  const spanLabel = m.spanDays == null
    ? NO_DATA
    : `${weightDeltaLabel} over ${Math.max(1, Math.round(m.spanDays / 7))} weeks`;

  return (
    <>
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
              <span className="font-mono">weight · kg</span>
            </div>
          </div>
          <div className="p-[18px]">
            <LineChart data={chartData} height={240} unit="kg" />
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
              const vol = workoutVolume(w);
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
                      {w.exercises.length} exercises · {w.exercises.reduce((n, e) => n + e.sets.length, 0)} sets
                    </span>
                  </div>
                  <span
                    className="inline-flex items-center font-mono font-medium text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap ml-3"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    {vol.toLocaleString()} kg
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
