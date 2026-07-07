import { useEffect, useState, useRef } from "react"
import { Terminal } from "lucide-react"

const LOG_MESSAGES = [
  { type: "info",  msg: "Network interface nominal." },
  { type: "info",  msg: "Storage sync cycle completed." },
  { type: "warn",  msg: "Remote sync timeout. Retrying..." },
  { type: "info",  msg: "Access control integrity check: PASSED." },
  { type: "info",  msg: "Power consumption nominal: 42W." },
  { type: "info",  msg: "Package registry updated. 14 new versions available." },
  { type: "warn",  msg: "Storybook build cache at 87% capacity." },
  { type: "error", msg: "Remote sync failed. Signal degraded." },
  { type: "info",  msg: "Health monitor: all services responding." },
  { type: "info",  msg: "Session authenticated. Access granted." },
  { type: "warn",  msg: "Analytics feed: 2 data sources unreachable." },
  { type: "info",  msg: "Venator CLI v0.1.5 — scaffold ready." },
  { type: "info",  msg: "Scheduled backup completed successfully." },
  { type: "warn",  msg: "Power grid: minor fluctuation detected." },
  { type: "info",  msg: "Certificate renewal: 12 days remaining." },
] as const

type LogType = (typeof LOG_MESSAGES)[number]["type"]

interface LogEntry {
  time: string
  type: LogType
  msg: string
}

const TAG_LABEL: Record<LogType, string> = { info: "[INF]", warn: "[WRN]", error: "[ERR]" }
const TAG_COLOR: Record<LogType, string> = {
  info: "var(--success)",
  warn: "var(--warn)",
  error: "var(--danger)",
}

export function TerminalLog() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initial: LogEntry[] = LOG_MESSAGES.slice(0, 4).map((l) => ({ ...l, time: formatTime() }))
    setLogs(initial)

    const interval = setInterval(() => {
      const random = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)]
      setLogs((prev) => [...prev, { ...random, time: formatTime() }].slice(-30))
    }, 4500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [logs])

  return (
    <div style={{ flexShrink: 0, borderTop: "1px solid var(--border-subtle)", background: "var(--bg-1)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 24px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <Terminal size={12} style={{ color: "var(--fg-4)" }} />
        <span
          style={{
            fontFamily: "var(--portal-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "var(--fg-4)",
            textTransform: "uppercase",
          }}
        >
          System log
        </span>
        <span
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--portal-mono)",
            fontSize: 9,
            letterSpacing: "0.14em",
            color: "var(--fg-5)",
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--success)" }} />
          LIVE
        </span>
      </div>
      <div
        ref={scrollRef}
        style={{
          height: 88,
          overflowY: "auto",
          padding: "8px 24px",
          fontFamily: "var(--portal-mono)",
          fontSize: 10.5,
          lineHeight: 1.9,
        }}
      >
        {logs.map((log, i) => (
          <div key={i} style={{ display: "flex", gap: 12 }}>
            <span style={{ color: "var(--fg-5)", flexShrink: 0 }}>{log.time}</span>
            <span style={{ color: TAG_COLOR[log.type], flexShrink: 0 }}>{TAG_LABEL[log.type]}</span>
            <span style={{ color: "var(--fg-3)" }}>{log.msg}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--amber)" }}>
          <span>{">"}</span>
          <span
            style={{
              width: 7,
              height: 12,
              background: "var(--amber)",
              animation: "portal-blink 1s step-end infinite",
            }}
          />
        </div>
      </div>
    </div>
  )
}

function formatTime() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}
