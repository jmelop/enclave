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
]

interface LogEntry {
  time: string
  type: string
  msg: string
}

export function TerminalLog() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initial: LogEntry[] = LOG_MESSAGES.slice(0, 4).map((l) => ({
      ...l,
      time: formatTime(),
    }))
    setLogs(initial)

    const interval = setInterval(() => {
      const randomLog =
        LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)]
      setLogs((prev) =>
        [...prev, { ...randomLog, time: formatTime() }].slice(-20)
      )
    }, 4000 + Math.random() * 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="bg-card font-mono">
      <div className="px-4 py-1 border-b border-border flex items-center gap-2">
        <Terminal className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
          SYSTEM LOG
        </span>
      </div>
      <div
        ref={scrollRef}
        className="h-24 overflow-y-auto px-4 py-2 space-y-0.5"
      >
        {logs.map((log, i) => (
          <div key={i} className="text-[10px] leading-5 flex gap-2">
            <span className="text-muted-foreground/50 shrink-0">{log.time}</span>
            <span
              className={`shrink-0 ${
                log.type === "error"
                  ? "text-destructive"
                  : log.type === "warn"
                  ? "text-amber"
                  : "text-accent"
              }`}
            >
              {log.type === "error"
                ? "[ERR]"
                : log.type === "warn"
                ? "[WRN]"
                : "[INF]"}
            </span>
            <span className="text-muted-foreground">{log.msg}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 text-[10px] text-primary">
          <span>{">"}</span>
          <span className="w-1.5 h-3 bg-primary cursor-blink" />
        </div>
      </div>
    </div>
  )
}

function formatTime() {
  const now = new Date()
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}
