import { useState, useRef } from 'react';

export interface ChartPoint {
  label: string;
  y: number;
}

interface LineChartProps {
  data: ChartPoint[];
  height?: number;
  yKey?: keyof ChartPoint;
  xKey?: keyof ChartPoint;
  unit?: string;
  ySpan?: 'auto' | [number, number];
  padding?: { top: number; right: number; bottom: number; left: number };
}

export default function LineChart({
  data,
  height = 260,
  unit = 'kg',
  ySpan = 'auto',
  padding,
}: LineChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const P = padding || { top: 16, right: 16, bottom: 32, left: 44 };
  const W = 800;
  const H = height;
  const innerW = W - P.left - P.right;
  const innerH = H - P.top - P.bottom;

  if (data.length === 0) {
    return (
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          height: H,
          color: 'var(--fg-4)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
        }}
      >
        no data yet
      </div>
    );
  }

  const ys = data.map(d => d.y);
  let yMin: number, yMax: number;
  if (ySpan === 'auto') {
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const range = max - min || 1;
    yMin = Math.floor((min - range * 0.18) * 2) / 2;
    yMax = Math.ceil((max + range * 0.18) * 2) / 2;
  } else {
    [yMin, yMax] = ySpan;
  }

  const xScale = (i: number) => P.left + (innerW * i) / Math.max(1, data.length - 1);
  const yScale = (v: number) => P.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const points = data.map((d, i) => ({
    x: xScale(i),
    y: yScale(d.y),
    v: d.y,
    label: d.label,
  }));

  const buildPath = (): string => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx.toFixed(2)} ${prev.y.toFixed(2)}, ${cpx.toFixed(2)} ${curr.y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
    }
    return d;
  };

  const areaPath = (): string => {
    if (points.length === 0) return '';
    let d = buildPath();
    d += ` L ${points[points.length - 1].x.toFixed(2)} ${(P.top + innerH).toFixed(2)}`;
    d += ` L ${points[0].x.toFixed(2)} ${(P.top + innerH).toFixed(2)} Z`;
    return d;
  };

  const tickCount = 4;
  const yTicks: { v: number; y: number }[] = [];
  for (let i = 0; i <= tickCount; i++) {
    const v = yMin + ((yMax - yMin) * i) / tickCount;
    yTicks.push({ v: Math.round(v * 10) / 10, y: yScale(v) });
  }

  const onMove = (e: React.MouseEvent) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const xRel = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].x - xRel);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    setHover(best);
  };

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', width: '100%' }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <line
            key={i}
            x1={P.left} x2={W - P.right}
            y1={t.y} y2={t.y}
            stroke="var(--border-subtle)"
            strokeWidth="1"
            strokeDasharray={i === 0 || i === tickCount ? '0' : '3 4'}
          />
        ))}

        {yTicks.map((t, i) => (
          <text
            key={`yl-${i}`}
            x={P.left - 8} y={t.y + 3}
            fontSize="10" textAnchor="end"
            fill="var(--fg-4)"
            fontFamily="JetBrains Mono, monospace"
          >
            {t.v}
          </text>
        ))}

        {points.map((pt, i) => {
          if (data.length > 8 && i % 2 !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={`xl-${i}`}
              x={pt.x} y={H - P.bottom + 18}
              fontSize="10" textAnchor="middle"
              fill="var(--fg-4)"
              fontFamily="JetBrains Mono, monospace"
            >
              {pt.label}
            </text>
          );
        })}

        <path d={areaPath()} fill="url(#chartFill)" />
        <path d={buildPath()} fill="none" stroke="var(--accent)" strokeWidth="2" />

        {points.map((pt, i) => (
          <g key={`p-${i}`}>
            <circle
              cx={pt.x} cy={pt.y}
              r={hover === i ? 5 : 3.2}
              fill="var(--bg-1)" stroke="var(--accent)" strokeWidth="2"
              style={{ transition: 'r 120ms ease' }}
            />
          </g>
        ))}

        {hover !== null && (
          <line
            x1={points[hover].x} x2={points[hover].x}
            y1={P.top} y2={P.top + innerH}
            stroke="var(--border-default)" strokeDasharray="3 3"
          />
        )}
      </svg>

      {hover !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${(points[hover].x / W) * 100}%`,
            top: `${(points[hover].y / H) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 12px))',
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
          <div style={{ color: 'var(--fg-4)', fontSize: 10, marginBottom: 2 }}>{points[hover].label}</div>
          <div>{points[hover].v} <span style={{ color: 'var(--fg-4)' }}>{unit}</span></div>
        </div>
      )}
    </div>
  );
}
