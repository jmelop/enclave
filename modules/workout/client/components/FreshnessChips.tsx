// Header chips for the body summary. Shared by OverviewPage and BodyPage —
// one implementation, two mount points.

const WAIST_STALE_DAYS = 7;

function Chip({ name, value, stale, title }: {
  name: string;
  value: string;
  stale?: boolean;
  title?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border"
      style={{
        borderColor: stale ? 'var(--warn)' : 'var(--border-subtle)',
        color: stale ? 'var(--warn)' : 'var(--fg-4)',
        background: stale ? 'var(--warn-bg)' : 'transparent',
      }}
      title={title}
    >
      <span style={{ color: stale ? 'var(--warn)' : 'var(--fg-5)' }}>{name}</span>
      {value}
    </span>
  );
}

function days(d: number | null): string {
  if (d == null) return '—';
  if (d === 0) return 'today';
  return `${d}d`;
}

function signed(n: number | null, unit: string): string {
  if (n == null) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(1)} ${unit}`;
}

export function FreshnessChips({ daysSinceWeight, daysSinceWaist }: {
  daysSinceWeight: number | null;
  daysSinceWaist: number | null;
}) {
  const waistStale = daysSinceWaist == null || daysSinceWaist > WAIST_STALE_DAYS;
  return (
    <>
      <Chip name="weight" value={days(daysSinceWeight)} />
      <Chip
        name="waist"
        value={days(daysSinceWaist)}
        stale={waistStale}
        title={waistStale ? `No waist measurement in over ${WAIST_STALE_DAYS} days` : undefined}
      />
    </>
  );
}

// No colour semantics: during a bulk, gaining weight is the point. The sign is
// the only signal — the app takes no view on direction.
export function TrendChips({ weeklyDelta, waistPerKg }: {
  weeklyDelta: number | null;
  waistPerKg: number | null;
}) {
  return (
    <>
      <Chip
        name="7d"
        value={signed(weeklyDelta, 'kg')}
        title="Change in the 7-day average against one week ago"
      />
      <Chip
        name="ratio"
        value={signed(waistPerKg, 'cm/kg')}
        title="Waist change per kg of bodyweight change"
      />
    </>
  );
}
