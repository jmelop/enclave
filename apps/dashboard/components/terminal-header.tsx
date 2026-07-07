import { Wifi, Cpu, Zap, Sun, Moon } from "lucide-react"

interface TerminalHeaderProps {
  time: string
  date: string
  cpu: number
  theme: "dark" | "light"
  onToggleTheme: () => void
}

export function TerminalHeader({ time, date, cpu, theme, onToggleTheme }: TerminalHeaderProps) {
  return (
    <header
      style={{
        flexShrink: 0,
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--portal-mono)", fontSize: 12 }}>
        <span style={{ color: "var(--fg-3)" }}>enclave</span>
        <span style={{ color: "var(--fg-5)" }}>/</span>
        <span style={{ color: "var(--fg)", fontWeight: 700 }}>portal</span>
        <span
          style={{
            width: 7,
            height: 13,
            background: "var(--amber)",
            marginLeft: 2,
            animation: "portal-blink 1s step-end infinite",
          }}
        />
      </div>

      {/* Center readouts */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontFamily: "var(--portal-mono)",
          fontSize: 10,
          letterSpacing: "0.1em",
          color: "var(--fg-4)",
          textTransform: "uppercase",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Wifi size={12} style={{ color: "var(--success)" }} />
          NET: SECURE
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Cpu size={12} style={{ color: "var(--fg-3)" }} />
          CPU: {cpu}%
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--amber)" }}>
          <Zap size={12} />
          PWR: NOMINAL
        </span>
      </div>

      {/* Clock + theme toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span
            style={{
              fontFamily: "var(--portal-mono)",
              fontSize: 12.5,
              letterSpacing: "0.14em",
              color: "var(--fg)",
            }}
          >
            {time}
          </span>
          <span
            style={{
              fontFamily: "var(--portal-mono)",
              fontSize: 9.5,
              letterSpacing: "0.1em",
              color: "var(--fg-4)",
            }}
          >
            {date}
          </span>
        </div>
        <button
          onClick={onToggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="portal-icon-btn"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-1)",
            color: "var(--fg-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  )
}
