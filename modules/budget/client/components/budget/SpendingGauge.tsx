import type { MonthMetrics } from '@/types/budget';
import { fmt, pct } from '@/lib/utils';

interface Props {
  metrics: MonthMetrics;
  size?: number;
}

const SWEEP = 268;
const START = (360 - SWEEP) / 2 + 180;

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = (a1 - a0) % 360 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

export function SpendingGauge({ metrics, size = 240 }: Props) {
  const { cats, totalBudget, spent, projected, pctOfBudget, inProgress } = metrics;
  const cx = size / 2;
  const cy = size / 2;
  const thickness = 22;
  const r = (size - thickness) / 2 - 6;
  const over = spent > totalBudget;
  const denom = over ? spent : totalBudget;
  const gap = 1.4;

  let cum = 0;
  const segs = cats.filter(c => c.spent > 0).map(c => {
    const a0 = START + (cum / denom) * SWEEP;
    cum += c.spent;
    const a1 = START + (cum / denom) * SWEEP;
    return { c, a0: a0 + gap / 2, a1: Math.max(a0 + gap / 2 + 0.5, a1 - gap / 2) };
  });

  const projAngle = START + Math.min(1, projected / denom) * SWEEP;
  const [pmx2, pmy2] = polar(cx, cy, r + thickness / 2 + 6, projAngle);
  const [pmx0, pmy0] = polar(cx, cy, r - thickness / 2 - 1, projAngle);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <filter id="bg-gshadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>
        {/* track */}
        <path
          d={arcPath(cx, cy, r, START, START + SWEEP)}
          stroke="var(--gauge-track)"
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="butt"
        />
        {/* category segments */}
        <g filter="url(#bg-gshadow)">
          {segs.map((s, i) => (
            <path
              key={i}
              d={arcPath(cx, cy, r, s.a0, s.a1)}
              stroke={s.c.color}
              strokeWidth={thickness}
              fill="none"
              strokeLinecap="butt"
            />
          ))}
        </g>
        {/* projected marker */}
        {inProgress && (
          <line
            x1={pmx0} y1={pmy0} x2={pmx2} y2={pmy2}
            stroke="var(--fg)" strokeWidth="2.5" strokeLinecap="round" opacity="0.75"
          />
        )}
      </svg>

      {/* center text */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 22%',
      }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 4 }}>
          spent
        </div>
        <div className="mono" style={{ fontSize: size * 0.155, fontWeight: 600, lineHeight: 1, color: over ? 'var(--danger)' : 'var(--fg)' }}>
          {fmt(spent)}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 5 }}>
          of <span style={{ color: 'var(--fg-2)' }}>{fmt(totalBudget)}</span>
        </div>
        <div style={{
          marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 100, fontSize: 10.5, fontWeight: 600,
          background: over ? 'rgba(248,113,113,.14)' : 'var(--accent-soft)',
          color: over ? 'var(--danger)' : 'var(--accent)',
        }}>
          {pct(pctOfBudget)} {over ? 'over' : 'used'}
        </div>
      </div>
    </div>
  );
}
