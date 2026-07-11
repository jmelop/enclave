import { useState } from "react"
import { type AppEntry, type AppStatus } from "@/lib/apps-data"
import {
  Radio, Eye, Package, FlaskConical, ShieldAlert, Wrench, Zap, Users,
  Satellite, Droplets, HeartPulse, Lock, CalendarDays, TrendingUp,
  Dumbbell, Receipt, Lightbulb, Target, Settings,
  ChevronRight,
} from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  Radio, Eye, Package, FlaskConical, ShieldAlert, Wrench, Zap, Users,
  Satellite, Droplets, HeartPulse, Lock, CalendarDays, TrendingUp,
  Dumbbell, Receipt, Lightbulb, Target, Settings,
}

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; glow: string }> = {
  online:      { label: "ONLINE",     color: "var(--success)", glow: "0 0 8px var(--success)" },
  maintenance: { label: "MAINT.",     color: "var(--warn)",    glow: "0 0 8px var(--warn)" },
  classified:  { label: "CLASSIFIED", color: "var(--danger)",  glow: "0 0 8px var(--danger)" },
  offline:     { label: "OFFLINE",    color: "var(--fg-4)",    glow: "none" },
}

interface AppCardProps {
  app: AppEntry
  onClick: () => void
}

export function AppCard({ app, onClick }: AppCardProps) {
  const [hover, setHover] = useState(false)
  const Icon = ICON_MAP[app.icon] ?? Wrench
  const status = STATUS_CONFIG[app.status]
  const online = app.status === "online"
  const lifted = hover && online

  return (
    <div
      onClick={online ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        borderRadius: 12,
        border: `1px solid ${lifted ? "var(--border-default)" : "var(--border-subtle)"}`,
        background: lifted ? "var(--card-2)" : "var(--card-1)",
        padding: "16px 16px 12px",
        opacity: online ? 1 : 0.55,
        cursor: online ? "pointer" : "default",
        transform: lifted ? "translateY(-2px)" : "none",
        boxShadow: lifted ? "0 10px 30px rgba(0, 0, 0, 0.25)" : "none",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <div
            style={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: 10,
              background: "var(--bg-2)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--amber)",
            }}
          >
            <Icon size={17} />
          </div>
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--fg)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {app.name}
            </span>
            <span
              style={{
                fontFamily: "var(--portal-mono)",
                fontSize: 10,
                letterSpacing: "0.12em",
                color: "var(--fg-4)",
                textTransform: "uppercase",
              }}
            >
              {app.codename}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, paddingTop: 2 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: status.color,
              boxShadow: status.glow === "none" ? undefined : status.glow,
            }}
          />
          <span
            style={{
              fontFamily: "var(--portal-mono)",
              fontSize: 9.5,
              letterSpacing: "0.1em",
              color: status.color,
            }}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "var(--fg-3)", minHeight: 39 }}>
        {app.description}
      </p>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: 10,
          marginTop: "auto",
        }}
      >
        <span
          style={{
            fontFamily: "var(--portal-mono)",
            fontSize: 10.5,
            letterSpacing: "0.06em",
            color: "var(--fg-4)",
          }}
        >
          PORT:{app.port} · v{app.version}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--portal-mono)",
              fontSize: 9.5,
              letterSpacing: "0.08em",
              color: "var(--fg-4)",
              background: "var(--bg-2)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              padding: "2px 6px",
            }}
          >
            CL-{app.clearanceLevel}
          </span>
          {online && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                fontFamily: "var(--portal-mono)",
                fontSize: 10,
                letterSpacing: "0.1em",
                color: "var(--amber)",
                opacity: lifted ? 1 : 0.65,
                transition: "opacity 0.18s",
              }}
            >
              LAUNCH
              <ChevronRight size={12} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
