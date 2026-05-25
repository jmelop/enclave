import { useState, useEffect } from "react"
import { Wifi, Cpu, Zap } from "lucide-react"

export function TerminalHeader() {
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      )
      setDate(
        now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="border-b border-[#2a2d2a] bg-[#101310]">
      <div className="flex items-center justify-between px-4 py-1.5 lg:px-6">
        {/* Left: Logo and branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-6 h-6 text-primary font-bold text-[11px]">
            E
          </div>
          <div className="hidden sm:block">
            <div
              className="text-foreground text-sm font-mono tracking-widest uppercase terminal-text"
              style={{ textShadow: "0 0 10px #e8a83e88, 0 0 20px #e8a83e44" }}
            >
              Enclave Systems
            </div>
            <div className="text-muted-foreground text-[10px] tracking-wider uppercase">
              Unified Application Portal v1.0.0
            </div>
          </div>
        </div>

        {/* Center: Status bar */}
        <div className="hidden md:flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-accent" />
            <span>Net: secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-foreground" />
            <span>Cpu: 23%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-primary">Pwr: nominal</span>
          </div>
        </div>

        {/* Right: Clock */}
        <div className="text-right font-mono">
          <div
            className="text-primary text-[13px] tracking-widest"
            style={{ textShadow: "0 0 6px #e8a83e66" }}
          >
            {time}
          </div>
          <div className="text-muted-foreground text-[10px] tracking-wider">
            {date}
          </div>
        </div>
      </div>

    </header>
  )
}
