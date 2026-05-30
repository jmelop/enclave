import type { CategoryMetrics } from '@/types/budget';
import { fmt } from '@/lib/utils';

interface Props {
  cats: CategoryMetrics[];
  size?: number;
}

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

export function DonutChart({ cats, size = 200 }: Props) {
  const total = cats.reduce((s, c) => s + c.spent, 0);
  const cx = size / 2;
  const cy = size / 2;
  const th = 24;
  const r = size / 2 - th / 2 - 4;

  let cum = 0;
  const segments = cats.filter(c => c.spent > 0).map(c => {
    const a0 = (cum / total) * 360;
    cum += c.spent;
    const a1 = (cum / total) * 360;
    return { c, a0: a0 + 0.8, a1: Math.max(a0 + 0.8 + 0.5, a1 - 0.8) };
  });

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        {segments.map((s, i) => (
          <path
            key={i}
            d={arcPath(cx, cy, r, s.a0, s.a1)}
            stroke={s.c.color}
            strokeWidth={th}
            fill="none"
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center',
      }}>
        <div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg-4)', marginBottom: 4 }}>
            TOTAL
          </div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
            {fmt(total)}
          </div>
        </div>
      </div>
    </div>
  );
}
