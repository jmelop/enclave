// Days since the last weight and waist readings, tracked separately.
// Shared by OverviewPage and BodyPage — one implementation, two mount points.

const WAIST_STALE_DAYS = 7;

interface Props {
  daysSinceWeight: number | null;
  daysSinceWaist: number | null;
}

function label(days: number | null): string {
  if (days == null) return '—';
  if (days === 0) return 'today';
  return `${days}d`;
}

function Chip({ name, days, stale }: { name: string; days: number | null; stale?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border"
      style={{
        borderColor: stale ? 'var(--warn)' : 'var(--border-subtle)',
        color: stale ? 'var(--warn)' : 'var(--fg-4)',
        background: stale ? 'var(--warn-bg)' : 'transparent',
      }}
      title={stale ? `No waist measurement in over ${WAIST_STALE_DAYS} days` : undefined}
    >
      <span style={{ color: stale ? 'var(--warn)' : 'var(--fg-5)' }}>{name}</span>
      {label(days)}
    </span>
  );
}

export function FreshnessChips({ daysSinceWeight, daysSinceWaist }: Props) {
  const waistStale = daysSinceWaist == null || daysSinceWaist > WAIST_STALE_DAYS;
  return (
    <div className="flex items-center gap-2">
      <Chip name="weight" days={daysSinceWeight} />
      <Chip name="waist" days={daysSinceWaist} stale={waistStale} />
    </div>
  );
}
