// Configure real URLs in .env.local
// NEXT_PUBLIC_APP_<ID>_URL=http://your-server-ip:port

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

export const APPS: AppEntry[] = [
  {
    id: "portfolio-tracker",
    name: "Portfolio Tracker",
    codename: "VAULTCAP",
    description: "Strategic asset monitoring for equities, ETFs, crypto holdings, and capital allocation oversight.",
    category: "finance",
    status: "online",
    port: 8082,
    version: "1.0.0",
    lastAccess: "2026-05-14 14:32:00",
    clearanceLevel: 2,
    icon: "TrendingUp",
    url: undefined,
    route: '/portfolio',
  },
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
  {
    id: "task-manager",
    name: "Task Manager",
    codename: "OPS",
    description: "Project tracking, sprint planning, and backlog management across active development cycles.",
    category: "logistics",
    status: "online",
    port: 8081,
    version: "3.2.1",
    lastAccess: "2026-05-14 12:00:00",
    clearanceLevel: 2,
    icon: "Package",
    url: undefined,
  },
  {
    id: "system-monitor",
    name: "System Monitor",
    codename: "SYSTEM",
    description: "CPU, memory, disk, and network telemetry. Process health and resource allocation oversight.",
    category: "utilities",
    status: "online",
    port: 3006,
    version: "6.0.1",
    lastAccess: "2026-05-14 12:01:00",
    clearanceLevel: 2,
    icon: "Zap",
    url: undefined,
  },
  {
    id: "identity-vault",
    name: "Identity Vault",
    codename: "ROSTER",
    description: "Credential storage, access level management, and role-based permission assignments.",
    category: "logistics",
    status: "online",
    port: 3007,
    version: "3.3.3",
    lastAccess: "2026-05-14 10:30:00",
    clearanceLevel: 3,
    icon: "Users",
    url: undefined,
  },
  {
    id: "remote-sync",
    name: "Remote Sync",
    codename: "UPLINK",
    description: "Distributed node synchronization layer. Limited connectivity available on degraded networks.",
    category: "communications",
    status: "offline",
    port: 3008,
    version: "1.2.0",
    lastAccess: "2026-05-10 16:00:00",
    clearanceLevel: 5,
    icon: "Satellite",
    url: undefined,
  },
  {
    id: "backup-service",
    name: "Backup Service",
    codename: "ARCHIVE",
    description: "Automated snapshot scheduling, incremental backups, and off-site replication management.",
    category: "utilities",
    status: "online",
    port: 3009,
    version: "2.1.5",
    lastAccess: "2026-05-14 11:00:00",
    clearanceLevel: 1,
    icon: "Droplets",
    url: undefined,
  },
  {
    id: "social-tracker",
    name: "Social Tracker",
    codename: "RADAR",
    description: "Social media metrics, audience analytics, and cross-platform engagement tracking.",
    category: "research",
    status: "online",
    port: 3010,
    version: "0.0.1",
    lastAccess: "2026-05-14 10:00:00",
    clearanceLevel: 2,
    icon: "Radio",
    url: undefined,
  },
  {
    id: "cyber-intel",
    name: "Cyber Intel",
    codename: "WATCHDOG",
    description: "Network threat monitoring, vulnerability scanning, and security event aggregation across all nodes.",
    category: "intelligence",
    status: "online",
    port: 3002,
    version: "2.4.0",
    lastAccess: "2026-05-14 09:15:00",
    clearanceLevel: 4,
    icon: "Eye",
    url: undefined,
  },
  {
    id: "health-monitor",
    name: "Health Monitor",
    codename: "PULSE",
    description: "Service uptime tracking, latency diagnostics, and incident response queue across all endpoints.",
    category: "defense",
    status: "online",
    port: 3011,
    version: "4.5.2",
    lastAccess: "2026-05-14 08:45:00",
    clearanceLevel: 2,
    icon: "HeartPulse",
    url: undefined,
  },
  {
    id: "access-control",
    name: "Access Control",
    codename: "SENTINEL",
    description: "Authentication gateway, session management, and perimeter security monitoring.",
    category: "defense",
    status: "online",
    port: 3012,
    version: "7.0.0",
    lastAccess: "2026-05-14 12:05:00",
    clearanceLevel: 4,
    icon: "Lock",
    url: undefined,
  },
]
