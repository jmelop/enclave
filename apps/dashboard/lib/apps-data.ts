import { clientModules } from "../../../enclave.modules.client"

export type AppStatus = "online" | "offline" | "maintenance" | "classified"

export type AppCategory =
  | "finance"
  | "productivity"
  | "health"
  | "development"
  | "home"
  | "tools"

export interface AppEntry {
  id: string
  name: string
  codename: string
  description: string
  category: AppCategory
  status: AppStatus
  port: number
  version: string
  lastAccess: string
  clearanceLevel: number
  icon: string
  url?: string
  route?: string
}

export const CATEGORIES: Record<AppCategory, { label: string; icon: string }> = {
  finance: { label: "Finance", icon: "TrendingUp" },
  productivity: { label: "Productivity", icon: "CalendarDays" },
  health: { label: "Health", icon: "HeartPulse" },
  development: { label: "Development", icon: "Code2" },
  home: { label: "Home", icon: "House" },
  tools: { label: "Tools", icon: "Wrench" }
}

// ─── Module apps (auto-generated) ────────────────────────────────────────────
// Every module registered in enclave.modules.client gets a portal card.
// Card metadata comes from each module's `portal` config; missing fields fall
// back to defaults derived from the module itself.

const MODULE_APPS: AppEntry[] = clientModules.map((mod) => {
  const meta = mod.portal ?? {}
  const category: AppCategory =
    meta.category && meta.category in CATEGORIES ? (meta.category as AppCategory) : "tools"
  return {
    id: mod.id,
    name: meta.name ?? mod.navLabel,
    codename: meta.codename ?? mod.id.toUpperCase(),
    description: meta.description ?? `${mod.navLabel} — enclave module.`,
    category,
    status: "online",
    port: 5173,
    version: meta.version ?? "0.1.0",
    lastAccess: "—",
    clearanceLevel: meta.clearanceLevel ?? 1,
    icon: meta.icon ?? "Package",
    route: mod.basePath,
  }
})

// ─── External apps (manual) ──────────────────────────────────────────────────
// Apps not served by the enclave shell — opened in a new tab via `url`.

const EXTERNAL_APPS: AppEntry[] = [
  {
    id: "icloud-calendar",
    name: "iCloud Calendar",
    codename: "CHRONOS",
    description: "Personal scheduling, events, and reminders via iCloud Calendar.",
    category: "productivity",
    status: "online",
    port: 443,
    version: "web",
    lastAccess: "2026-05-14 11:45:00",
    clearanceLevel: 1,
    icon: "CalendarDays",
    url: "https://www.icloud.com/calendar/",
  },
  {
    id: "venator-ui",
    name: "Venator UI",
    codename: "CODEX",
    description: "Component library documentation, design tokens, pattern reference, and CLI usage guides.",
    category: "development",
    status: "online",
    port: 3004,
    version: "0.1.6",
    lastAccess: "2026-05-14 08:00:00",
    clearanceLevel: 1,
    icon: "FlaskConical",
    url: "https://venatorui.com/docs",
  },
]

export const APPS: AppEntry[] = [...MODULE_APPS, ...EXTERNAL_APPS]
