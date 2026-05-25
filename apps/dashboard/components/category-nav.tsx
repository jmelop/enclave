import { type AppCategory, CATEGORIES } from "@/lib/apps-data"
import {
  Radio,
  Eye,
  Package,
  FlaskConical,
  ShieldAlert,
  Wrench,
  LayoutGrid,
  TrendingUp,
} from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  Radio,
  Eye,
  Package,
  FlaskConical,
  ShieldAlert,
  Wrench,
  TrendingUp,
}

interface CategoryNavProps {
  selected: AppCategory | "all"
  onSelect: (cat: AppCategory | "all") => void
  counts: Record<string, number>
}

export function CategoryNav({ selected, onSelect, counts }: CategoryNavProps) {
  return (
    <nav className="flex flex-wrap gap-0.5 lg:flex-col">
      <button
        onClick={() => onSelect("all")}
        className={`flex items-center gap-2 px-2 py-2 text-[11px] uppercase tracking-wider font-mono transition-all border w-full ${
          selected === "all"
            ? "border-primary/30 bg-primary/5 text-[#d4d8cc]"
            : "border-transparent text-[#6b6e64] hover:text-[#d4d8cc] hover:border-border"
        }`}
        style={selected === "all" ? { textShadow: "0 0 6px #e8a83e33" } : undefined}
      >
        <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden lg:inline">All systems</span>
        <span className="lg:hidden">All</span>
        <span className="ml-auto text-[10px] opacity-40">{counts["all"] ?? 0}</span>
      </button>

      {(Object.entries(CATEGORIES) as [AppCategory, { label: string; icon: string }][]).map(
        ([key, { label, icon }]) => {
          const Icon = ICON_MAP[icon] ?? Wrench
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`flex items-center gap-2 px-2 py-2 text-[11px] uppercase tracking-wider font-mono transition-all border w-full ${
                selected === key
                  ? "border-primary/30 bg-primary/5 text-[#d4d8cc]"
                  : "border-transparent text-[#6b6e64] hover:text-[#d4d8cc] hover:border-border"
              }`}
              style={selected === key ? { textShadow: "0 0 6px #e8a83e33" } : undefined}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden lg:inline">{label}</span>
              <span className="ml-auto text-[10px] opacity-40">{counts[key] ?? 0}</span>
            </button>
          )
        }
      )}
    </nav>
  )
}
