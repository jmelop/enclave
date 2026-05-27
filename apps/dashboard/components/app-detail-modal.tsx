import { useNavigate } from "react-router-dom"
import { type AppEntry } from "@/lib/apps-data"
import {
  Radio, Eye, Package, FlaskConical, ShieldAlert, Wrench,
  Zap, Users, Satellite, Droplets, Crosshair, HeartPulse,
  Lock, ExternalLink, CalendarDays, TrendingUp, X,
} from "lucide-react"
import { Modal, ModalContent, ModalFooter, Button } from "@venator-ui/ui"

const ICON_MAP: Record<string, React.ElementType> = {
  Radio, Eye, Package, FlaskConical, ShieldAlert, Wrench,
  Zap, Users, Satellite, Droplets, Crosshair, HeartPulse,
  Lock, CalendarDays, TrendingUp,
}

interface AppDetailModalProps {
  app: AppEntry | null
  onClose: () => void
}

export function AppDetailModal({ app, onClose }: AppDetailModalProps) {
  const navigate = useNavigate()
  if (!app) return null

  const Icon = ICON_MAP[app.icon] ?? Wrench
  const isOnline = app.status === "online"

  const statusColor =
    app.status === "online"      ? "var(--enclave-green)"  :
    app.status === "maintenance" ? "var(--enclave-amber)"  :
    app.status === "classified"  ? "var(--enclave-danger)" :
    "var(--muted-foreground)"

  return (
    <Modal
      open={app !== null}
      onClose={onClose}
      size="lg"
      className="bg-[#111411] border border-[#2a2d2a] font-mono !rounded-none shadow-none"
    >
      {/* Manual header with icon */}
      <div className="bg-[#0f0c00] border-b border-[#2a2d2a] flex items-center gap-2 px-4 py-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-primary tracking-widest uppercase text-sm font-mono flex-1">
          {app.codename}
        </span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <ModalContent className="bg-[#111411] font-mono">
        <div className="space-y-4">
          {/* App name + icon */}
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <h2
              className="text-base text-primary tracking-wider uppercase"
              style={{ textShadow: "0 0 6px #e8a83e33" }}
            >
              {app.name}
            </h2>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {app.description}
          </p>

          {/* Stats grid */}
          <div className="border border-[#2a2d2a] bg-[#0c0e0c] p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground tracking-wider">Status: </span>
                <span style={{ color: statusColor }}>{app.status.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-muted-foreground tracking-wider">Port: </span>
                <span className="text-primary">{app.port}</span>
              </div>
              <div>
                <span className="text-muted-foreground tracking-wider">Version: </span>
                <span className="text-primary">{app.version}</span>
              </div>
              <div>
                <span className="text-muted-foreground tracking-wider">Clearance: </span>
                <span className="text-primary">Level {app.clearanceLevel}</span>
              </div>
            </div>
            <div className="text-xs pt-1 border-t border-[#2a2d2a]/50">
              <span className="text-muted-foreground tracking-wider">Last access: </span>
              <span className="text-primary">{app.lastAccess}</span>
            </div>
          </div>
        </div>
      </ModalContent>

      <ModalFooter className="bg-[#111411] border-t border-[#2a2d2a] font-mono !rounded-none">
        <div className="flex gap-2 w-full">
          {isOnline ? (
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                if (app.route) { navigate(app.route); onClose() }
                else if (app.url) { window.open(app.url, "_blank"); onClose() }
              }}
              className="font-mono tracking-widest uppercase text-xs !bg-[var(--enclave-amber-glow)] !text-[var(--enclave-amber)] !border-[var(--enclave-amber-dim)]"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              Launch application
            </Button>
          ) : (
            <Button
              variant="ghost"
              fullWidth
              disabled
              className="font-mono tracking-widest uppercase text-xs cursor-not-allowed"
            >
              {app.status === "classified" ? "Access denied" : "Unavailable"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="font-mono tracking-widest uppercase text-xs"
          >
            CLOSE
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}
