import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { type AppEntry, type AppStatus } from "@/lib/apps-data"
import {
  Radio, Eye, Package, FlaskConical, ShieldAlert, Wrench, Zap, Users,
  Satellite, Droplets, HeartPulse, Lock, CalendarDays, TrendingUp,
  ExternalLink, X,
} from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  Radio, Eye, Package, FlaskConical, ShieldAlert, Wrench, Zap, Users,
  Satellite, Droplets, HeartPulse, Lock, CalendarDays, TrendingUp,
}

const STATUS_LABEL: Record<AppStatus, string> = {
  online: "ONLINE",
  maintenance: "MAINT.",
  classified: "CLASSIFIED",
  offline: "OFFLINE",
}

function statusColor(status: AppStatus): string {
  if (status === "online") return "var(--success)"
  if (status === "maintenance") return "var(--warn)"
  if (status === "classified") return "var(--danger)"
  return "var(--fg-4)"
}

interface AppDetailModalProps {
  app: AppEntry | null
  onClose: () => void
}

export function AppDetailModal({ app, onClose }: AppDetailModalProps) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!app) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [app, onClose])

  if (!app) return null

  const Icon = ICON_MAP[app.icon] ?? Wrench
  const online = app.status === "online"
  const statusCol = statusColor(app.status)

  const launch = () => {
    if (app.route) navigate(app.route)
    else if (app.url) window.open(app.url, "_blank")
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: "calc(100vw - 48px)",
          borderRadius: 16,
          border: "1px solid var(--border-default)",
          background: "var(--bg-1)",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          animation: "portal-fade-up 0.18s ease",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            background: "var(--bg-2)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <Icon size={13} style={{ color: "var(--amber)" }} />
          <span
            style={{
              fontFamily: "var(--portal-mono)",
              fontSize: 11,
              letterSpacing: "0.18em",
              color: "var(--fg-2)",
              textTransform: "uppercase",
              flex: 1,
            }}
          >
            {app.codename}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              border: "none",
              background: "transparent",
              color: "var(--fg-4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: "var(--bg-2)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--amber)",
              }}
            >
              <Icon size={20} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 17, fontWeight: 650, color: "var(--fg)" }}>{app.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusCol }} />
                <span
                  style={{
                    fontFamily: "var(--portal-mono)",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    color: statusCol,
                  }}
                >
                  {STATUS_LABEL[app.status]}
                </span>
              </span>
            </div>
          </div>

          {/* Description */}
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--fg-3)" }}>{app.description}</p>

          {/* Metadata */}
          <div
            style={{
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-2)",
              borderRadius: 12,
              padding: "13px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 9,
              fontFamily: "var(--portal-mono)",
              fontSize: 11,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <div>
                <span style={{ color: "var(--fg-4)" }}>PORT: </span>
                <span style={{ color: "var(--fg-2)" }}>{app.port}</span>
              </div>
              <div>
                <span style={{ color: "var(--fg-4)" }}>VERSION: </span>
                <span style={{ color: "var(--fg-2)" }}>v{app.version}</span>
              </div>
              <div>
                <span style={{ color: "var(--fg-4)" }}>CLEARANCE: </span>
                <span style={{ color: "var(--amber)" }}>LEVEL {app.clearanceLevel}</span>
              </div>
              <div>
                <span style={{ color: "var(--fg-4)" }}>STATUS: </span>
                <span style={{ color: statusCol }}>{STATUS_LABEL[app.status]}</span>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 9 }}>
              <span style={{ color: "var(--fg-4)" }}>LAST ACCESS: </span>
              <span style={{ color: "var(--fg-2)" }}>{app.lastAccess}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "14px 18px",
            borderTop: "1px solid var(--border-subtle)",
            background: "var(--bg-1)",
          }}
        >
          {online ? (
            <button
              onClick={launch}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 38,
                borderRadius: 10,
                border: "none",
                background: "var(--amber)",
                color: "var(--amber-ink)",
                fontFamily: "var(--portal-sans)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "filter 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
            >
              <ExternalLink size={14} />
              Launch application
            </button>
          ) : (
            <button
              disabled
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 38,
                borderRadius: 10,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-2)",
                color: "var(--fg-4)",
                fontFamily: "var(--portal-sans)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "not-allowed",
              }}
            >
              {app.status === "classified" ? "Access denied" : "Unavailable"}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "0 18px",
              height: 38,
              borderRadius: 10,
              border: "1px solid var(--border-default)",
              background: "transparent",
              color: "var(--fg-2)",
              fontFamily: "var(--portal-sans)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
