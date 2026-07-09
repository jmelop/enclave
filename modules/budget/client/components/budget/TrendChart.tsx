import type { CategoryId, MonthData } from '@/types/budget';
import { computeMetrics, fmt } from '@/lib/utils';

interface Props {
  months: MonthData[];
  budgets: Record<CategoryId, number>;
  activeIdx: number;
  onSelect: (i: number) => void;
  compact?: boolean;
}

export function TrendChart({ months, budgets, activeIdx, onSelect, compact }: Props) {
  const data = months.map(m => {
    const mm = computeMetrics(m, budgets);
    return { m, spent: mm.spent, income: m.income, budget: mm.totalBudget };
  });

  const W = 700;
  const H = compact ? 144 : 204;
  const padL = 8, padR = 8, padT = compact ? 14 : 16, padB = 24;
  const maxV = Math.max(...data.map(d => Math.max(d.income, d.spent, d.budget))) * 1.15;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const n = data.length;
  const slot = iw / n;
  const bw = Math.min(compact ? 28 : 32, slot * (compact ? 0.32 : 0.36));
  const yv = (v: number) => padT + ih - (v / maxV) * ih;
  const xv = (i: number) => padL + slot * i + slot / 2;

  const incomePts = data.map((d, i) => `${xv(i)},${yv(d.income)}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
    >
      {/* budget reference line */}
      <line
        x1={padL} y1={yv(data[data.length - 1].budget)}
        x2={W - padR} y2={yv(data[data.length - 1].budget)}
        stroke="var(--border-default)" strokeWidth="1" strokeDasharray="3 4"
      />

      {data.map((d, i) => {
        const active = i === activeIdx;
        const over = d.spent > d.budget;
        const barY = yv(d.spent);
        const barH = padT + ih - barY;
        const labelInside = barH > (compact ? 23 : 26);
        return (
          <g key={i} onClick={() => onSelect(i)} style={{ cursor: 'pointer' }}>
            <rect x={xv(i) - slot / 2} y={padT} width={slot} height={ih} fill="transparent" />
            <rect
              x={xv(i) - bw / 2} y={barY} width={bw} height={barH} rx="3.5"
              fill={active ? 'var(--accent)' : (over ? 'var(--danger)' : 'var(--bg-3)')}
              stroke={active ? 'none' : 'var(--border-subtle)'}
              style={{ transition: 'all .25s ease' }}
            />
            {active && (
              <text
                x={xv(i)} y={labelInside ? barY + (compact ? 12 : 14) : barY - 6}
                textAnchor="middle"
                fontSize={compact ? 8.8 : 9.5}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
                fill={labelInside ? '#000' : 'var(--fg)'}
              >
                {fmt(d.spent)}
              </text>
            )}
            <text
              x={xv(i)} y={H - 7}
              textAnchor="middle" fontSize={compact ? 8.8 : 9.2}
              fontFamily="JetBrains Mono, monospace"
              fill={active ? 'var(--fg)' : 'var(--fg-4)'}
              fontWeight={active ? '600' : '400'}
            >
              {d.m.label.slice(0, 3).toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* income polyline */}
      <polyline
        points={incomePts}
        fill="none" stroke="var(--success)" strokeWidth={compact ? 1.15 : 1.25}
        strokeLinejoin="round" strokeLinecap="round"
      />
      {data.map((d, i) => (
        <circle key={i} cx={xv(i)} cy={yv(d.income)} r={compact ? 1.8 : 2.1} fill="var(--bg-1)" stroke="var(--success)" strokeWidth={compact ? 1.15 : 1.25} />
      ))}
    </svg>
  );
}
