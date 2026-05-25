import { Search } from "lucide-react"

interface TerminalSearchProps {
  query: string
  onQueryChange: (q: string) => void
}

export function TerminalSearch({ query, onQueryChange }: TerminalSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search applications..."
        className="w-full bg-[#111411] border border-border text-foreground placeholder-muted-foreground text-xs tracking-wider uppercase font-mono pl-10 pr-20 py-2 focus:outline-none focus:border-primary/40 transition-all"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tracking-wider hidden sm:block">
        {'[CTRL+K]'}
      </div>
    </div>
  )
}
