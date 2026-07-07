import { clientModules } from "../../../enclave.modules.client"

export type AppStatus = "online" | "offline" | "maintenance" | "classified"

export type AppCategory =
  | "communications"
  | "intelligence"
  | "logistics"
  | "research"
  | "defense"
  | "utilities"
  | "finance"

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
  communications: { label: "COMMS", icon: "Radio" },
  intelligence: { label: "INTEL", icon: "Eye" },
  logistics: { label: "LOGISTICS", icon: "Package" },
  research: { label: "RESEARCH", icon: "FlaskConical" },
  defense: { label: "DEFENSE", icon: "ShieldAlert" },
  utilities: { label: "UTILITIES", icon: "Wrench" },
  finance: { label: "FINANCE", icon: "TrendingUp" }
}

// ─── Module apps (auto-generated) ────────────────────────────────────────────
// Every module registered in enclave.modules.client gets a portal card.
// Card metadata comes from each module's `portal` config; missing fields fall
// back to defaults derived from the module itself.

const MODULE_APPS: AppEntry[] = clientModules.map((mod) => {
  const meta = mod.portal ?? {}
  const category: AppCategory =
    meta.category && meta.category in CATEGORIES ? (meta.category as AppCategory) : "utilities"
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
    category: "communications",
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
    category: "research",
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
