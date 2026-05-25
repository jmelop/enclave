import { useEffect, useState } from "react"
import { APPS } from "@/lib/apps-data"
import { Activity, HardDrive, Thermometer, Shield } from "lucide-react"

function useAnimatedValue(base: number, variance: number) {
  const [val, setVal] = useState(base)
  useEffect(() => {
    const interval = setInterval(() => {
      setVal(base + Math.floor(Math.random() * variance * 2) - variance)
    }, 2000 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [base, variance])
  return val
}

export function StatusPanel() {
  const onlineCount = APPS.filter((a) => a.status === "online").length
  const totalCount = APPS.length
  const storage = useAnimatedValue(47, 3)
  const coreTemp = useAnimatedValue(62, 4)

  return (
    <div className="border border-border bg-card px-3 py-3 font-mono">
      <div className="text-[10px] text-muted-foreground tracking-widest uppercase mb-2 flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-primary" />
        System status
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] tracking-wider mb-1">
            <span className="text-muted-foreground">Apps online</span>
            <span className="text-accent">{onlineCount}/{totalCount}</span>
          </div>
          <div className="w-full h-1 bg-secondary overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-1000"
              style={{
                width: `${(onlineCount / totalCount) * 100}%`,
                boxShadow: "0 0 6px #4aba4a66",
              }}
            />
          </div>
        </div>

        <div className="border-t border-border/50 pt-3 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] tracking-wider">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="w-3 h-3" />
              STORAGE
            </span>
            <span className="text-primary">{storage}%</span>
          </div>
          <div className="flex items-center justify-between text-[11px] tracking-wider">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Thermometer className="w-3 h-3" />
              CORE TEMP
            </span>
            <span className="text-foreground">{coreTemp}C</span>
          </div>
          <div className="flex items-center justify-between text-[11px] tracking-wider">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="w-3 h-3" />
              SECURITY
            </span>
            <span className="text-accent">NOMINAL</span>
          </div>
        </div>

        <div className="border-t border-border/50 pt-2">
          <div className="text-[9px] text-center leading-relaxed opacity-30" style={{ color: "var(--muted-foreground)" }}>
            {'================================'}
            <br />
            {'Enclave // self-hosted ops'}
            <br />
            {'Powered by venator ui'}
            <br />
            {'================================'}
          </div>
        </div>
      </div>
    </div>
  )
}
