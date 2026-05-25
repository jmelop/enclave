import { useState } from "react"
import { type AppEntry, type AppStatus } from "@/lib/apps-data"
import {
  Radio,
  Eye,
  Package,
  FlaskConical,
  ShieldAlert,
  Wrench,
  Zap,
  Users,
  Satellite,
  Droplets,
  Crosshair,
  HeartPulse,
  Lock,
  ExternalLink,
  ChevronRight,
  CalendarDays,
  TrendingUp,
} from "lucide-react"
import { Tooltip } from "@venator-ui/ui"

const ICON_MAP: Record<string, React.ElementType> = {
  Radio,
  Eye,
  Package,
  FlaskConical,
  ShieldAlert,
  Wrench,
  Zap,
  Users,
  Satellite,
  Droplets,
  Crosshair,
  HeartPulse,
  Lock,
  CalendarDays,
  TrendingUp,
}

const STATUS_CONFIG: Record<
  AppStatus,
  { label: string; color: string; dotColor: string; glow?: string }
> = {
  online: {
    label: "ONLINE",
    color: "text-accent",
    dotColor: "bg-[#4aba4a]",
    glow: "0 0 4px #4aba4a",
  },
  offline: {
    label: "OFFLINE",
    color: "text-muted-foreground",
    dotColor: "bg-[#555]",
  },
  maintenance: {
    label: "MAINT.",
    color: "text-primary",
    dotColor: "bg-primary",
    glow: "0 0 4px #e8a83e",
  },
  classified: {
    label: "CLASSIFIED",
    color: "text-destructive",
    dotColor: "bg-destructive",
    glow: "0 0 4px #c44040",
  },
}

export function AppCard({ app }: { app: AppEntry }) {
  const [hovered, setHovered] = useState(false)
  const Icon = ICON_MAP[app.icon] ?? Wrench
  const status = STATUS_CONFIG[app.status]
  const isAccessible = app.status === "online"

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={!isAccessible}
      className={`group relative w-full text-left border transition-all duration-300 font-mono ${
        isAccessible
          ? "border-border/40 hover:border-primary/40 cursor-pointer"
          : "border-border/40 opacity-60 cursor-not-allowed"
      } ${!isAccessible ? "bg-[#0f120f]" : hovered ? "bg-primary/5" : "bg-[#111411]"}`}
    >
      {/* Top accent line */}
      <div
        className={`absolute top-0 left-0 h-px transition-all duration-500 ${
          hovered && isAccessible ? "w-full" : "w-0"
        }`}
        style={{ background: "linear-gradient(to right, #e8a83e, transparent)" }}
      />

      <div className="p-4">
        {/* Header: Icon, Name, Status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex items-center justify-center w-9 h-9 border shrink-0 text-primary ${
                isAccessible ? "border-primary/30" : "border-border"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div
                className="text-xs tracking-wider uppercase truncate text-[#d4d8cc]"
                style={hovered && isAccessible ? { textShadow: "0 0 6px #e8a83e33" } : undefined}
              >
                {app.name}
              </div>
              <div className="text-[10px] text-muted-foreground tracking-wider">
                {app.codename}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}
              style={status.glow ? { boxShadow: status.glow } : undefined}
            />
            <span className={`text-[10px] tracking-wider ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2 line-clamp-2">
          {app.description}
        </p>

        {/* Footer metadata */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground tracking-wider border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-3">
            <span>PORT:{app.port}</span>
            <span>v{app.version}</span>
          </div>
          <div className="flex items-center gap-1">
            {isAccessible ? (
              <Tooltip content={app.url ?? "URL not configured"} side="top">
                <span className="flex items-center gap-1">
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    LAUNCH
                  </span>
                  <ChevronRight className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </Tooltip>
            ) : (
              <ExternalLink className="w-3 h-3 opacity-30" />
            )}
          </div>
        </div>
      </div>

      {/* Clearance indicator */}
      <div className="absolute bottom-0 right-0 px-1.5 py-0.5 text-[9px] tracking-wider bg-secondary text-muted-foreground">
        CL-{app.clearanceLevel}
      </div>
    </button>
  )
}
