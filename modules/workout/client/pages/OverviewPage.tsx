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

export default function OverviewPage() {
  const navigate = useNavigate();
  const { sessions, bodyLog } = useWorkoutStore();

  const sessionsMonth = sessionsThisMonth(sessions);
  const latestWeight  = bodyLog[bodyLog.length - 1]?.weight ?? 0;
  const firstWeight   = bodyLog[0]?.weight ?? 0;
  const weightDelta   = (latestWeight - firstWeight).toFixed(1);
  const streak        = currentStreak(sessions);
  const volWeek       = volumeThisWeek(sessions);

  const chartData = useMemo(() => (
    bodyLog.slice(-8).map(b => ({ label: formatDate(b.date, { short: true }), y: b.weight }))
  ), [bodyLog]);

  const recentSessions = sessions.slice(0, 4);

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard
          title="Sessions this month"
          icon={<Dumbbell size={14} />}
          value={
            <span className="font-mono">
              {sessionsMonth}
              <span className="text-lg text-fg-4 font-medium ml-1">/ 12</span>
            </span>
          }
          description="+2 vs last month"
        />
        <StatCard
          title="Current weight"
          icon={<Scale size={14} />}
          value={<span className="font-mono">{latestWeight.toFixed(1)} <span className="text-lg text-fg-4 font-medium">kg</span></span>}
          description={`${weightDelta} kg over 10 weeks`}
        />
        <StatCard
          title="Current streak"
          icon={<Flame size={14} />}
          value={<span className="font-mono">{streak} <span className="text-lg text-fg-4 font-medium">wk</span></span>}
          description="goal: 12 weeks"
        />
        <StatCard
          title="Volume this week"
          icon={<TrendingUp size={14} />}
          value={<span className="font-mono">{volWeek.toLocaleString()} <span className="text-lg text-fg-4 font-medium">kg</span></span>}
          description="+8% vs last week"
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
          value="125"
          unit="kg"
          label="Squat · 1 rep"
          mono
        />
        <MiniInfoCard
          title="Most frequent exercise"
          value="Bench Press"
          label="3 sessions this month"
        />
        <MiniInfoCard
          title="Suggested next session"
          value="Pull A"
          label="2 days since last session"
        />
      </div>

      {/* Delta indicators row */}
      <div className="grid grid-cols-4 gap-3 mt-3">
        <div className="flex items-center gap-1.5 text-[11px] text-success">
          <TrendingUp size={12} />
          <span className="font-mono">+2 sessions vs last month</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-danger">
          <TrendingDown size={12} />
          <span className="font-mono">{weightDelta} kg total</span>
        </div>
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
