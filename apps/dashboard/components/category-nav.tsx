import { useState } from "react"
import { type AppCategory, CATEGORIES } from "@/lib/apps-data"
import {
  CalendarDays, Code2, HeartPulse, House, Wrench, LayoutGrid, TrendingUp,
} from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  CalendarDays, Code2, HeartPulse, House, Wrench, TrendingUp,
}

interface CategoryNavProps {
  selected: AppCategory | "all"
  onSelect: (cat: AppCategory | "all") => void
  counts: Record<string, number>
}

interface RowProps {
  active: boolean
  Icon: React.ElementType
  label: string
  count: number
  onClick: () => void
}

function CategoryRow({ active, Icon, label, count, onClick }: RowProps) {
  const [hover, setHover] = useState(false)
  const bg = active ? "var(--bg-2)" : hover ? "var(--bg-2)" : "transparent"
  const border = active ? "1px solid var(--border-subtle)" : "1px solid transparent"
  const color = active || hover ? "var(--fg)" : "var(--fg-3)"
  const iconColor = active ? "var(--amber)" : "var(--fg-4)"
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "8px 10px",
        borderRadius: 8,
        border,
        background: bg,
        color,
        fontFamily: "var(--portal-sans)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", color: iconColor }}>
        <Icon size={15} />
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ fontFamily: "var(--portal-mono)", fontSize: 10.5, color: "var(--fg-5)" }}>
        {count}
      </span>
    </button>
  )
}

export function CategoryNav({ selected, onSelect, counts }: CategoryNavProps) {
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <CategoryRow
        active={selected === "all"}
        Icon={LayoutGrid}
        label="All systems"
        count={counts["all"] ?? 0}
        onClick={() => onSelect("all")}
      />
      {(Object.entries(CATEGORIES) as [AppCategory, { label: string; icon: string }][]).map(
        ([key, { label, icon }]) => {
          const Icon = ICON_MAP[icon] ?? Wrench
          const displayLabel = toTitle(label)
          return (
            <CategoryRow
              key={key}
              active={selected === key}
              Icon={Icon}
              label={displayLabel}
              count={counts[key] ?? 0}
              onClick={() => onSelect(key)}
            />
          )
        },
      )}
    </nav>
  )
}

function toTitle(label: string) {
  if (!label) return label
  return label.charAt(0) + label.slice(1).toLowerCase()
}
