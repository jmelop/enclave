import { Truck, Zap, ShieldAlert } from "lucide-react"

interface StatusPanelProps {
  onlineCount: number
  totalCount: number
  storage: number
  temp: number
}

export function StatusPanel({ onlineCount, totalCount, storage, temp }: StatusPanelProps) {
  const onlinePct = totalCount === 0 ? 0 : Math.round((onlineCount / totalCount) * 100)

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 6px 8px" }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--fg-5)" }} />
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--fg-4)",
            fontWeight: 600,
          }}
        >
          System status
        </span>
      </div>

      <div
        style={{
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-1)",
          borderRadius: 12,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Apps online */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, color: "var(--fg-3)" }}>Apps online</span>
            <span style={{ fontFamily: "var(--portal-mono)", fontSize: 11, color: "var(--success)" }}>
              {onlineCount}/{totalCount}
            </span>
          </div>
          <div style={{ width: "100%", height: 4, borderRadius: 99, background: "var(--bg-3)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                background: "var(--success)",
                width: `${onlinePct}%`,
                transition: "width 1s ease",
              }}
            />
          </div>
        </div>

        {/* Telemetry */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: 11,
            display: "flex",
            flexDirection: "column",
            gap: 9,
          }}
        >
          <Row icon={<Truck size={12} />} label="Storage" value={`${storage}%`} valueColor="var(--amber)" />
          <Row icon={<Zap size={12} />} label="Core temp" value={`${temp}C`} valueColor="var(--fg-2)" />
          <Row icon={<ShieldAlert size={12} />} label="Security" value="NOMINAL" valueColor="var(--success)" />
        </div>

        {/* ASCII footer */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: 11,
            fontFamily: "var(--portal-mono)",
            fontSize: 8,
            lineHeight: 1.9,
            letterSpacing: "0.04em",
            color: "var(--fg-5)",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          ==========================<br />
          Enclave // self-hosted ops<br />
          Powered by venator ui<br />
          ==========================
        </div>
      </div>
    </div>
  )
}

function Row({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueColor: string
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--fg-3)" }}>
        {icon}
        {label}
      </span>
      <span style={{ fontFamily: "var(--portal-mono)", fontSize: 11, color: valueColor }}>{value}</span>
    </div>
  )
}
