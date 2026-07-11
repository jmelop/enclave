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
  const maxV = Math.max(1, ...data.map(d => Math.max(d.income, d.spent, d.budget))) * 1.15;
  const fullIw = W - padL - padR;
  const plotScale = compact ? 1 : 0.68;
  const iw = fullIw * plotScale;
  const plotL = padL + (fullIw - iw) / 2;
  const plotR = plotL + iw;
  const ih = H - padT - padB;
  const n = data.length;
  const slot = iw / n;
  const bw = Math.min(compact ? 16.8 : 19.2, slot * (compact ? 0.192 : 0.216));
  const pairGap = compact ? 2 : 2.5;
  const yv = (v: number) => padT + ih - (v / maxV) * ih;
  const xv = (i: number) => plotL + slot * i + slot / 2;
  // Spent + income bars sit side by side, centered on the month slot.
  const spentCx  = (i: number) => xv(i) - pairGap / 2 - bw / 2;
  const incomeCx = (i: number) => xv(i) + pairGap / 2 + bw / 2;
  const labelSize = compact ? 5.1 : 5.7;
  // Compact slots are too narrow for two full €-figures side by side.
  const fmtBar = (v: number) => (compact && v >= 1000 ? `€${(v / 1000).toFixed(1)}k` : fmt(v));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
    >
      {/* budget reference line */}
      <line
        x1={plotL} y1={yv(data[data.length - 1].budget)}
        x2={plotR} y2={yv(data[data.length - 1].budget)}
        stroke="var(--border-default)" strokeWidth="0.6" strokeDasharray="3 4"
      />

      {data.map((d, i) => {
        const active = i === activeIdx;
        const over = d.spent > d.budget;
        return (
          <g key={i} onClick={() => onSelect(i)} style={{ cursor: 'pointer' }}>
            <rect x={xv(i) - slot / 2} y={padT} width={slot} height={ih} fill="transparent" />
            {d.spent > 0 && (
              <>
                <rect
                  x={spentCx(i) - bw / 2} y={yv(d.spent)} width={bw} height={padT + ih - yv(d.spent)} rx="2.1"
                  fill={over ? 'var(--danger)' : 'var(--accent)'}
                  opacity={active ? 1 : 0.38}
                  style={{ transition: 'all .25s ease' }}
                />
                <text
                  x={spentCx(i)} y={yv(d.spent) - 4}
                  textAnchor="middle"
                  fontSize={labelSize}
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                  fill={active ? 'var(--fg)' : 'var(--fg-4)'}
                  style={{ transition: 'fill .25s ease' }}
                >
                  {fmtBar(d.spent)}
                </text>
              </>
            )}
            {d.income > 0 && (
              <>
                <rect
                  x={incomeCx(i) - bw / 2} y={yv(d.income)} width={bw} height={padT + ih - yv(d.income)} rx="2.1"
                  fill="var(--success)"
                  opacity={active ? 1 : 0.38}
                  style={{ transition: 'all .25s ease' }}
                />
                <text
                  x={incomeCx(i)} y={yv(d.income) - 4}
                  textAnchor="middle"
                  fontSize={labelSize}
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                  fill="var(--success)"
                  opacity={active ? 1 : 0.5}
                  style={{ transition: 'opacity .25s ease' }}
                >
                  {fmtBar(d.income)}
                </text>
              </>
            )}
            <text
              x={xv(i)} y={H - 7}
              textAnchor="middle" fontSize={compact ? 5.3 : 5.5}
              fontFamily="JetBrains Mono, monospace"
              fill={active ? 'var(--fg)' : 'var(--fg-4)'}
              fontWeight={active ? '600' : '400'}
            >
              {d.m.label.slice(0, 3).toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
