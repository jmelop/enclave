import type { RefObject } from "react"

interface TerminalSearchProps {
  query: string
  onQueryChange: (q: string) => void
  matchCount: number
  inputRef?: RefObject<HTMLInputElement>
}

export function TerminalSearch({ query, onQueryChange, matchCount, inputRef }: TerminalSearchProps) {
  const matchLabel = matchCount === 1 ? "1 MATCH" : `${matchCount} MATCHES`

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-1)",
        borderRadius: 10,
        padding: "0 14px",
        height: 42,
      }}
    >
      <span style={{ fontFamily: "var(--portal-mono)", fontSize: 13, color: "var(--amber)" }}>$</span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="search by name, codename or description…"
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          fontFamily: "var(--portal-mono)",
          fontSize: 12.5,
          color: "var(--fg)",
          padding: 0,
          minWidth: 0,
        }}
      />
      <span style={{ fontFamily: "var(--portal-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--fg-5)" }}>
        [CTRL+K]
      </span>
      <span style={{ fontFamily: "var(--portal-mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--fg-4)" }}>
        {matchLabel}
      </span>
    </div>
  )
}
