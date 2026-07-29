import { useState, useRef } from 'react';

export interface ChartSeries {
  key: string;
  label: string;
  /** Aligned to `labels`; null means no reading that day. */
  values: (number | null)[];
  axis?: 'left' | 'right';
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
  /** Renders a clickable legend that toggles each series. */
  legend?: boolean;
  /** Extra tooltip line for the hovered index. */
  note?: (index: number) => string | null;
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

export default function LineChart({
  labels,
  series,
  height = 260,
  legend = false,
  note,
  padding,
}: LineChartProps) {
  // `left` is wrapper-relative px: the svg is letterboxed by preserveAspectRatio,
  // so viewBox units and element pixels are not interchangeable.
  const [hover, setHover] = useState<{ i: number; left: number } | null>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const visible = series.filter(s => !hidden[s.key]);
  const hasRight = visible.some(s => s.axis === 'right');

  // Extra headroom when units are shown so they clear the topmost tick label.
  const showsUnits = visible.some(s => s.unit);
  const P = padding || {
    top: showsUnits ? 36 : 16,
    right: hasRight ? 52 : 16,
    bottom: 32,
    left: 48,
  };
  const W = 800;
  const H = height;
  const innerW = W - P.left - P.right;
  const innerH = H - P.top - P.bottom;

  const axisValues = (axis: 'left' | 'right') =>
    visible
      .filter(s => (s.axis ?? 'left') === axis)
      .flatMap(s => s.values.filter((v): v is number => v != null));

  const leftVals = axisValues('left');
  const rightVals = axisValues('right');
  const leftScale = leftVals.length > 0 ? scaleOf(leftVals) : null;
  const rightScale = rightVals.length > 0 ? scaleOf(rightVals) : null;

  const leftSeries = visible.find(s => (s.axis ?? 'left') === 'left');
  const rightSeries = visible.find(s => s.axis === 'right');

  const xAt = (i: number) => P.left + (innerW * i) / Math.max(1, labels.length - 1);
  const yAt = (v: number, scale: Scale) =>
    P.top + innerH - ((v - scale.min) / (scale.max - scale.min)) * innerH;

  const scaleFor = (s: ChartSeries) => ((s.axis ?? 'left') === 'right' ? rightScale : leftScale);

  const empty = labels.length === 0 || visible.length === 0 || (!leftScale && !rightScale);

  const legendRow = legend && (
    <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
      {series.map(s => {
        const off = !!hidden[s.key];
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setHidden(h => ({ ...h, [s.key]: !h[s.key] }))}
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

  if (empty) {
    return (
      <div>
        <div
          style={{
            display: 'grid', placeItems: 'center', height: H,
            color: 'var(--fg-4)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          }}
        >
          no data yet
        </div>
        {legendRow}
      </div>
    );
  }

  // Map through the SVG's own CTM instead of assuming the drawing fills the
  // element: on a wide container it is scaled and centred, so element pixels
  // are offset from viewBox units by the letterbox on each side.
  const onMove = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap) return;
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

    pt.x = xAt(best);
    pt.y = 0;
    const screenX = pt.matrixTransform(ctm).x;
    setHover({ i: best, left: screenX - wrap.getBoundingClientRect().left });
  };

  // One <path> per segment: the existing curve already uses per-segment control
  // points, so this renders identically while allowing per-segment dashing.
  const segmentsOf = (s: ChartSeries) => {
    const scale = scaleFor(s);
    if (!scale) return [];
    const pts: { i: number; x: number; y: number }[] = [];
    for (let i = 0; i < s.values.length; i++) {
      const v = s.values[i];
      if (v == null) continue;
      pts.push({ i, x: xAt(i), y: yAt(v, scale) });
    }
    const out: { d: string; dashed: boolean }[] = [];
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1]!;
      const b = pts[k]!;
      // 'break' only joins points that are adjacent in the source array.
      if ((s.gaps ?? 'break') === 'break' && b.i !== a.i + 1) continue;
      const cpx = (a.x + b.x) / 2;
      out.push({
        d: `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} C ${cpx.toFixed(2)} ${a.y.toFixed(2)}, ${cpx.toFixed(2)} ${b.y.toFixed(2)}, ${b.x.toFixed(2)} ${b.y.toFixed(2)}`,
        dashed: !!s.dashed?.[b.i],
      });
    }
    return out;
  };

  const ticksOf = (scale: Scale) => {
    const out: { v: number; y: number }[] = [];
    for (let i = 0; i <= 4; i++) {
      const v = scale.min + ((scale.max - scale.min) * i) / 4;
      out.push({ v: Math.round(v * 10) / 10, y: yAt(v, scale) });
    }
    return out;
  };

  const hoverRows = hover == null ? [] : visible
    .map(s => ({ s, v: s.values[hover.i] }))
    .filter((r): r is { s: ChartSeries; v: number } => r.v != null);

  const hoverX = hover == null ? 0 : xAt(hover.i);
  const hoverNote = hover == null || !note ? null : note(hover.i);

  return (
    <div>
      <div
        ref={wrapRef}
        style={{ position: 'relative', width: '100%' }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
          {leftScale && ticksOf(leftScale).map((t, i) => (
            <line
              key={`g-${i}`}
              x1={P.left} x2={W - P.right}
              y1={t.y} y2={t.y}
              stroke="var(--border-subtle)" strokeWidth="1"
              strokeDasharray={i === 0 || i === 4 ? '0' : '3 4'}
            />
          ))}

          {/* Left axis ticks, tinted with their series colour */}
          {leftScale && ticksOf(leftScale).map((t, i) => (
            <text
              key={`ly-${i}`}
              x={P.left - 8} y={t.y + 3}
              fontSize="10" textAnchor="end"
              fill={leftSeries?.color ?? 'var(--fg-4)'}
              fontFamily="JetBrains Mono, monospace"
            >
              {t.v}
            </text>
          ))}

          {/* Right axis ticks */}
          {rightScale && ticksOf(rightScale).map((t, i) => (
            <text
              key={`ry-${i}`}
              x={W - P.right + 8} y={t.y + 3}
              fontSize="10" textAnchor="start"
              fill={rightSeries?.color ?? 'var(--fg-4)'}
              fontFamily="JetBrains Mono, monospace"
            >
              {t.v}
            </text>
          ))}

          {/* Axis units — the two scales are independent and must not read as comparable */}
          {leftScale && leftSeries?.unit && (
            <text
              x={P.left - 8} y={P.top - 18}
              fontSize="10" textAnchor="end"
              fill={leftSeries.color} fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              {leftSeries.unit}
            </text>
          )}
          {rightScale && rightSeries?.unit && (
            <text
              x={W - P.right + 8} y={P.top - 18}
              fontSize="10" textAnchor="start"
              fill={rightSeries.color} fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              {rightSeries.unit}
            </text>
          )}

          {labels.map((label, i) => {
            if (labels.length > 8 && i % 2 !== 0 && i !== labels.length - 1) return null;
            return (
              <text
                key={`xl-${i}`}
                x={xAt(i)} y={H - P.bottom + 18}
                fontSize="10" textAnchor="middle"
                fill="var(--fg-4)" fontFamily="JetBrains Mono, monospace"
              >
                {label}
              </text>
            );
          })}

          {visible.map(s => (
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
                const scale = scaleFor(s);
                if (!scale) return null;
                return (
                  <circle
                    key={`${s.key}-d-${i}`}
                    cx={xAt(i)} cy={yAt(v, scale)}
                    r={hover?.i === i ? 4.5 : 3}
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

        {hover !== null && hoverRows.length > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${hover.left}px`,
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
              {labels[hover.i]}
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
      {legendRow}
    </div>
  );
}
