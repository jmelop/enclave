import { Card, Checkbox, Badge } from '@venator-ui/ui'
import { Target, CheckSquare, BarChart3, FlaskConical } from 'lucide-react'
import { useStrategyStore } from '@/store/strategyStore'
import { goalColor } from '@/lib/seed'
import { GoalDot } from '@/components/strategy/GoalDot'
import { Ring } from '@/components/strategy/Ring'
import { ProgressBar } from '@/components/strategy/ProgressBar'

// ── SVG loop ribbon with animated pulses ──────────────────────────────────────

const STAGE_ICONS: Record<string, React.ReactNode> = {
  goals:   <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></>,
  plans:   <><path d="M5 5.5h14"/><path d="M5 12h14"/><path d="M5 18.5h9"/><circle cx="19" cy="18.5" r="2.2"/></>,
  results: <><path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v3.2h3.2"/></>,
  intel:   <><path d="M9.5 17.5h5"/><path d="M10 20.5h4"/><path d="M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2h5.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5Z"/></>,
}

const STAGE_LABELS: Record<string, string> = {
  goals: 'Goals', plans: 'Plans', results: 'Results', intel: 'Intel',
}

const XS = [70, 240, 410, 580]
const CY = 72
const R  = 20

// The closed loop path pulses travel along
const MID_X = (XS[0] + XS[3]) / 2
const LOOP_PATH = [
  `M${XS[0]},${CY}`,
  `L${XS[1]},${CY}`,
  `L${XS[2]},${CY}`,
  `L${XS[3]},${CY}`,
  `C${XS[3] + R + 40},${CY} ${XS[3] + R + 40},20 ${MID_X},20`,
  `C${XS[0] - R - 40},20 ${XS[0] - R - 40},${CY} ${XS[0]},${CY}`,
  'Z',
].join(' ')

function LoopRibbon({
  counts,
  onNavigate,
}: {
  counts: Record<string, number>
  onNavigate: (view: string) => void
}) {
  const STAGES = ['goals', 'plans', 'results', 'intel'] as const

  return (
    <Card padding="none">
      {/* gradient on the outer div so it covers text area + SVG + bottom gap without ever cutting off */}
      <div style={{
        background: 'radial-gradient(ellipse 70% 90% at 50% 50%, rgba(251,191,36,0.08) 0%, transparent 68%)',
        borderRadius: 'inherit',
        padding: '14px 18px 24px',
      }}>
        <div className="hero-tag mono" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2"/><path d="M12 4a8 8 0 0 1 7.5 5.3"/><path d="M20 12a8 8 0 0 1-5.3 7.5"/><path d="M12 20a8 8 0 0 1-7.5-5.3"/><path d="M4 12a8 8 0 0 1 5.3-7.5"/>
          </svg>
          The loop
        </div>
        <p style={{ fontSize: 10.5, color: 'var(--fg-4)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4, marginBottom: 0 }}>
          goal color flows through each stage · intel feeds back to goals
        </p>

      <svg
        viewBox="0 0 660 124"
        style={{ width: '100%', height: 160, display: 'block', overflow: 'hidden' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker id="str-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 1 L8 5 L0 9" fill="none" stroke="var(--fg-4)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
          <radialGradient id="str-haze" cx="50%" cy="55%" r="65%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>


        {/* forward connectors */}
        {XS.slice(0, 3).map((x, i) => (
          <line
            key={i}
            x1={x + R + 8} y1={CY}
            x2={XS[i + 1] - R - 8} y2={CY}
            stroke="var(--border-default)" strokeWidth="1.6"
            markerEnd="url(#str-arrow)"
          />
        ))}

        {/* return arc (dashed) */}
        <path
          d={`M${XS[3] + R},${CY} C${XS[3] + R + 40},${CY} ${XS[3] + R + 40},20 ${MID_X},20 C${XS[0] - R - 40},20 ${XS[0] - R - 40},${CY} ${XS[0] - R - 2},${CY}`}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="1.6"
          strokeDasharray="2 6"
          strokeLinecap="round"
          markerEnd="url(#str-arrow)"
        />
        <text x={MID_X} y="13" textAnchor="middle" style={{ fill: 'var(--fg-4)', fontFamily: 'JetBrains Mono, monospace', fontSize: 7.5, letterSpacing: '0.1em' }}>
          FEEDBACK → GOALS
        </text>

        {/* moving pulses */}
        {/* CSS offset-path is more reliable than SMIL animateMotion.
            Negative animation-delay means "already N seconds into the cycle" — starts immediately. */}
        {([
          { delay: '0s',    r: 4.5, opacity: 0.95 },
          { delay: '-3s',   r: 3,   opacity: 0.55 },
          { delay: '-6s',   r: 3,   opacity: 0.55 },
        ] as const).map(({ delay, r, opacity }, i) => (
          <g
            key={i}
            style={{
              offsetPath: `path('${LOOP_PATH}')`,
              animation: `str-pulse 9s linear infinite`,
              animationDelay: delay,
            } as React.CSSProperties}
          >
            <circle r={r} fill="var(--accent)" opacity={opacity} cx="0" cy="0" />
          </g>
        ))}

        {/* stage nodes */}
        {STAGES.map((id, i) => (
          <g
            key={id}
            style={{ cursor: 'pointer' }}
            onClick={() => onNavigate(id)}
            transform={`translate(${XS[i]},${CY})`}
          >
            {/* ring hover effect via CSS class */}
            <circle r={R} fill="var(--bg-2)" stroke="var(--border-default)" strokeWidth="1.4" />
            <circle r={R} fill="none" stroke="var(--accent)" strokeWidth="1.4" opacity="0" className="loop-node-ring" />
            <foreignObject x={-R} y={-R} width={R * 2} height={R * 2}>
              <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--fg-3)' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  {STAGE_ICONS[id]}
                </svg>
              </div>
            </foreignObject>
            <text y={R + 14} textAnchor="middle" style={{ fill: 'var(--fg)', fontFamily: 'Space Grotesk, system-ui, sans-serif', fontSize: 10, fontWeight: 600 }}>
              {STAGE_LABELS[id]}
            </text>
            <text y={R + 24} textAnchor="middle" style={{ fill: 'var(--fg-4)', fontFamily: 'JetBrains Mono, monospace', fontSize: 7.5 }}>
              {String(counts[id] ?? 0).padStart(2, '0')} items
            </text>
          </g>
        ))}
      </svg>

      {/* SVG node hover ring — needs to stay inline because it targets SVG child elements */}
      <style>{`
        svg g:hover .loop-node-ring { opacity: 1; filter: drop-shadow(0 0 6px var(--accent)); }
        svg g:hover foreignObject div { color: var(--accent); }
      `}</style>
      </div>
    </Card>
  )
}

// ── Thread board ──────────────────────────────────────────────────────────────

interface Props { onNavigate: (view: string, goalId?: string) => void }

export function LoopPage({ onNavigate }: Props) {
  const { goals, plans, retros, intel, togglePlan } = useStrategyStore()
  const counts = {
    goals: goals.length, plans: plans.length,
    results: retros.length, intel: intel.length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <LoopRibbon counts={counts} onNavigate={onNavigate} />

      {/* Thread board */}
      <Card padding="none">
        {/* header */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr 1fr', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-2)' }}>
          {([
            { label: 'Goal',    icon: <Target size={14} />,       blurb: 'progress & metrics'  },
            { label: 'Plans',   icon: <CheckSquare size={14} />,  blurb: 'actionable steps'    },
            { label: 'Results', icon: <BarChart3 size={14} />,    blurb: 'what changed'        },
            { label: 'Intel',   icon: <FlaskConical size={14} />, blurb: 'notes & experiments' },
          ] as const).map(({ label, icon, blurb }, i) => (
            <div key={label} style={{ padding: '11px 14px 11px', borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', lineHeight: 1.2 }}>{label}</div>
                <div className="mono" style={{ fontSize: 9.5, color: 'var(--fg-4)', letterSpacing: '0.04em', marginTop: 2 }}>{blurb}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="loop-board-rows">
        {goals.map(g => {
          const c = goalColor(g)
          const gPlans  = plans.filter(p => p.goal === g.id).slice(0, 3)
          const gRetros = retros.filter(r => r.goal === g.id).slice(0, 2)
          const gIntel  = intel.filter(it => it.goal === g.id).slice(0, 2)
          return (
            <div
              key={g.id}
              className="loop-board-row"
              style={{ '--rail': c } as React.CSSProperties}
            >
              {/* left rail */}
              <div className="loop-rail" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--rail)' }} />

              {/* goal cell */}
              <div
                style={{ padding: '16px 14px 16px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
                onClick={() => onNavigate('goals', g.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <GoalDot goal={g} size={9} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{g.name}</span>
                  {g.northStar && <span style={{ fontSize: 8, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>★</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 11, color: c, fontWeight: 600 }}>{g.progress}%</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{g.metricNow} / {g.metric}</span>
                </div>
                <ProgressBar value={g.progress} color={c} />
              </div>

              {/* plans cell — same list style as PlansPage */}
              <div style={{ padding: '10px 10px', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {gPlans.map(p => (
                  <div
                    key={p.id}
                    className="loop-plan-row"
                    onClick={() => onNavigate('plans')}
                  >
                    <Checkbox
                      checked={p.done}
                      onCheckedChange={e => { e.stopPropagation?.(); togglePlan(p.id) }}
                      size="sm"
                    />
                    {/* accent icon: checkmark if done, chevron if pending */}
                    <span style={{ color: p.done ? 'var(--success)' : 'var(--accent)', fontSize: 10, flexShrink: 0, lineHeight: 1 }}>
                      {p.done ? '✓' : '›'}
                    </span>
                    <span style={{ flex: 1, fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: p.done ? 'var(--fg-4)' : 'var(--fg-2)', textDecoration: p.done ? 'line-through' : 'none' }}>
                      {p.title}
                    </span>
                    <Badge size="sm" variant="default">{p.horizon === 'week' ? 'W' : 'M'}</Badge>
                  </div>
                ))}
                {!gPlans.length && <span className="mono" style={{ fontSize: 10, color: 'var(--fg-5)', padding: '6px 6px' }}>—</span>}
              </div>

              {/* results cell */}
              <div style={{ padding: '14px 12px', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {gRetros.map(r => (
                  <div
                    key={r.id}
                    onClick={() => onNavigate('results')}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 7px', borderRadius: 7, background: 'var(--bg-2)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: 11.5, color: 'var(--fg-2)' }}
                  >
                    <BarChart3 size={11} style={{ color: 'var(--fg-4)', flexShrink: 0 }} />
                    <span className="mono">{r.period}</span>
                    <span className="mono" style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--fg-5)' }}>{r.cadence === 'weekly' ? 'W' : 'M'}</span>
                  </div>
                ))}
                {!gRetros.length && <span className="mono" style={{ fontSize: 10, color: 'var(--fg-5)' }}>—</span>}
              </div>

              {/* intel cell */}
              <div style={{ padding: '14px 12px', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {gIntel.map(it => (
                  <div
                    key={it.id}
                    onClick={() => onNavigate('intel')}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 7px', borderRadius: 7, background: 'var(--bg-2)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: 11.5, color: 'var(--fg-2)' }}
                  >
                    <FlaskConical size={11} style={{ color: 'var(--fg-4)', flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                    {it.type === 'result' && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: it.verdict === 'win' ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
                        {it.verdict === 'win' ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                ))}
                {!gIntel.length && <span className="mono" style={{ fontSize: 10, color: 'var(--fg-5)' }}>—</span>}
              </div>
            </div>
          )
        })}
        </div>
      </Card>
    </div>
  )
}
