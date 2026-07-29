import { useState, useRef, useLayoutEffect } from 'react';

export interface ChartSeries {
  key: string;
  label: string;
  /** Aligned to `labels`; null means no reading that day. */
  values: (number | null)[];
  color: string;
  opacity?: number;
  width?: number;
  /** 'break' leaves a hole (no trend to draw); 'bridge' joins across it. */
  gaps?: 'break' | 'bridge';
  /** Per point: the segment ending here is drawn dashed. */
  dashed?: boolean[];
  dots?: boolean;
  unit?: string;
}

interface LineChartProps {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  /** Off for a stacked panel that is not the bottom one. */
  showXLabels?: boolean;
  /** Extra tooltip line for the hovered index. */
  note?: (index: number) => string | null;
  /** Controlled hover, so stacked panels share one cursor. */
  hoverIndex?: number | null;
  onHoverChange?: (index: number | null) => void;
  /** Only one panel in a stack should render the tooltip. */
  tooltip?: boolean;
  /** Rows to list in the tooltip; defaults to the drawn series. */
  tooltipSeries?: ChartSeries[];
  padding?: { top: number; right: number; bottom: number; left: number };
}

interface Scale { min: number; max: number }

function scaleOf(values: number[]): Scale {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return {
    min: Math.floor((min - range * 0.18) * 2) / 2,
    max: Math.ceil((max + range * 0.18) * 2) / 2,
  };
}

export function ChartLegend({
  series,
  hidden,
  onToggle,
}: {
  series: ChartSeries[];
  hidden: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
      {series.map(s => {
        const off = !!hidden[s.key];
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onToggle(s.key)}
            aria-pressed={!off}
            className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0 text-[11px]"
            style={{ opacity: off ? 0.4 : 1, color: 'var(--fg-3)' }}
          >
            <span
              className="inline-block rounded-full"
              style={{
                width: 8, height: 8,
                background: s.color,
                opacity: off ? 0.5 : (s.opacity ?? 1),
              }}
            />
            <span style={{ textDecoration: off ? 'line-through' : 'none' }}>
              {s.label}{s.unit ? ` · ${s.unit}` : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function LineChart({
  labels,
  series,
  height = 260,
  showXLabels = true,
  note,
  hoverIndex,
  onHoverChange,
  tooltip = true,
  tooltipSeries,
  padding,
}: LineChartProps) {
  const [innerHover, setInnerHover] = useState<number | null>(null);
  const [tipLeft, setTipLeft] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const controlled = hoverIndex !== undefined;
  const hover = controlled ? hoverIndex ?? null : innerHover;
  const setHover = (i: number | null) => {
    if (!controlled) setInnerHover(i);
    onHoverChange?.(i);
  };

  const showsUnits = series.some(s => s.unit);
  const P = padding || {
    top: showsUnits ? 36 : 16,
    right: 16,
    bottom: showXLabels ? 32 : 10,
    left: 48,
  };
  const W = 800;
  const H = height;
  const innerW = W - P.left - P.right;
  const innerH = H - P.top - P.bottom;

  const values = series.flatMap(s => s.values.filter((v): v is number => v != null));
  const scale = values.length > 0 ? scaleOf(values) : null;
  const unitSeries = series.find(s => s.unit);

  const xAt = (i: number) => P.left + (innerW * i) / Math.max(1, labels.length - 1);
  const yAt = (v: number) =>
    scale ? P.top + innerH - ((v - scale.min) / (scale.max - scale.min)) * innerH : 0;

  // The svg is letterboxed by preserveAspectRatio, so viewBox units and element
  // pixels differ. Map through the svg's own CTM rather than the element rect.
  useLayoutEffect(() => {
    if (hover == null) return;
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = xAt(hover);
    pt.y = 0;
    setTipLeft(pt.matrixTransform(ctm).x - wrap.getBoundingClientRect().left);
  });

  const empty = labels.length === 0 || series.length === 0 || !scale;

  if (empty) {
    return (
      <div
        style={{
          display: 'grid', placeItems: 'center', height: H,
          color: 'var(--fg-4)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
        }}
      >
        no data yet
      </div>
    );
  }

  const onMove = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const vx = pt.matrixTransform(ctm.inverse()).x;
    if (vx < 0 || vx > W) { setHover(null); return; }

    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < labels.length; i++) {
      const d = Math.abs(xAt(i) - vx);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    setHover(best);
  };

  // One <path> per segment: the curve already uses per-segment control points,
  // so this renders identically while allowing per-segment dashing.
  const segmentsOf = (s: ChartSeries) => {
    const pts: { i: number; x: number; y: number }[] = [];
    for (let i = 0; i < s.values.length; i++) {
      const v = s.values[i];
      if (v == null) continue;
      pts.push({ i, x: xAt(i), y: yAt(v) });
    }
    const out: { d: string; dashed: boolean }[] = [];
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1]!;
      const b = pts[k]!;
      if ((s.gaps ?? 'break') === 'break' && b.i !== a.i + 1) continue;
      const cpx = (a.x + b.x) / 2;
      out.push({
        d: `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} C ${cpx.toFixed(2)} ${a.y.toFixed(2)}, ${cpx.toFixed(2)} ${b.y.toFixed(2)}, ${b.x.toFixed(2)} ${b.y.toFixed(2)}`,
        dashed: !!s.dashed?.[b.i],
      });
    }
    return out;
  };

  const ticks: { v: number; y: number }[] = [];
  for (let i = 0; i <= 4; i++) {
    const v = scale.min + ((scale.max - scale.min) * i) / 4;
    ticks.push({ v: Math.round(v * 10) / 10, y: yAt(v) });
  }

  const rowSource = tooltipSeries ?? series;
  const hoverRows = hover == null ? [] : rowSource
    .map(s => ({ s, v: s.values[hover] }))
    .filter((r): r is { s: ChartSeries; v: number } => r.v != null);

  const hoverX = hover == null ? 0 : xAt(hover);
  const hoverNote = hover == null || !note ? null : note(hover);

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', width: '100%' }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
        {ticks.map((t, i) => (
          <line
            key={`g-${i}`}
            x1={P.left} x2={W - P.right}
            y1={t.y} y2={t.y}
            stroke="var(--border-subtle)" strokeWidth="1"
            strokeDasharray={i === 0 || i === 4 ? '0' : '3 4'}
          />
        ))}

        {ticks.map((t, i) => (
          <text
            key={`y-${i}`}
            x={P.left - 8} y={t.y + 3}
            fontSize="10" textAnchor="end"
            fill={unitSeries?.color ?? 'var(--fg-4)'}
            fontFamily="JetBrains Mono, monospace"
          >
            {t.v}
          </text>
        ))}

        {unitSeries?.unit && (
          <text
            x={P.left - 8} y={P.top - 18}
            fontSize="10" textAnchor="end"
            fill={unitSeries.color} fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
          >
            {unitSeries.unit}
          </text>
        )}

        {showXLabels && labels.map((label, i) => {
          if (labels.length > 8 && i % 2 !== 0 && i !== labels.length - 1) return null;
          return (
            <text
              key={`x-${i}`}
              x={xAt(i)} y={H - P.bottom + 18}
              fontSize="10" textAnchor="middle"
              fill="var(--fg-4)" fontFamily="JetBrains Mono, monospace"
            >
              {label}
            </text>
          );
        })}

        {series.map(s => (
          <g key={s.key} opacity={s.opacity ?? 1}>
            {segmentsOf(s).map((seg, i) => (
              <path
                key={`${s.key}-${i}`}
                d={seg.d}
                fill="none"
                stroke={s.color}
                strokeWidth={s.width ?? 2}
                strokeDasharray={seg.dashed ? '5 4' : undefined}
                strokeLinecap="round"
              />
            ))}
            {(s.dots ?? true) && s.values.map((v, i) => {
              if (v == null) return null;
              return (
                <circle
                  key={`${s.key}-d-${i}`}
                  cx={xAt(i)} cy={yAt(v)}
                  r={hover === i ? 4.5 : 3}
                  fill="var(--bg-1)" stroke={s.color} strokeWidth="2"
                  style={{ transition: 'r 120ms ease' }}
                />
              );
            })}
          </g>
        ))}

        {hover !== null && (
          <line
            x1={hoverX} x2={hoverX}
            y1={P.top} y2={P.top + innerH}
            stroke="var(--border-default)" strokeDasharray="3 3"
          />
        )}
      </svg>

      {tooltip && hover !== null && hoverRows.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: `${tipLeft}px`,
            top: 8,
            transform: 'translateX(-50%)',
            background: 'var(--bg-2)',
            border: '1px solid var(--border-default)',
            color: 'var(--fg)',
            padding: '6px 10px',
            borderRadius: 6,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
            zIndex: 2,
          }}
        >
          <div style={{ color: 'var(--fg-4)', fontSize: 10, marginBottom: 3 }}>
            {labels[hover]}
          </div>
          {hoverRows.map(({ s, v }) => (
            <div key={s.key} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span
                className="inline-block rounded-full"
                style={{ width: 6, height: 6, background: s.color }}
              />
              <span style={{ color: 'var(--fg-3)' }}>{s.label}</span>
              <span style={{ marginLeft: 'auto' }}>
                {v}
                {s.unit && <span style={{ color: 'var(--fg-4)' }}> {s.unit}</span>}
              </span>
            </div>
          ))}
          {hoverNote && (
            <div style={{ color: 'var(--fg-4)', fontSize: 10, marginTop: 3 }}>{hoverNote}</div>
          )}
        </div>
      )}
    </div>
  );
}
