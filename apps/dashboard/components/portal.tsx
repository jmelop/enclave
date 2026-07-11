import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useEnclaveSettings } from "@enclave/ui-shell"
import { APPS, type AppCategory, type AppEntry, CATEGORIES } from "@/lib/apps-data"
import { AppDetailModal } from "./app-detail-modal"
import { TerminalHeader } from "./terminal-header"
import { CategoryNav } from "./category-nav"
import { TerminalSearch } from "./terminal-search"
import { AppCard } from "./app-card"
import { StatusPanel } from "./status-panel"
import { TerminalLog } from "./terminal-log"

type Theme = "dark" | "light"

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  try {
    const saved = localStorage.getItem("enclave-theme")
    if (saved === "light" || saved === "dark") return saved
  } catch {}
  const attr = document.documentElement.getAttribute("data-theme")
  return attr === "light" ? "light" : "dark"
}

export function Portal() {
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedApp, setSelectedApp] = useState<AppEntry | null>(null)
  const [theme, setTheme] = useState<Theme>(readInitialTheme)
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")
  const [cpu, setCpu] = useState(23)
  const [storage, setStorage] = useState(47)
  const [temp, setTemp] = useState(59)
  const searchRef = useRef<HTMLInputElement>(null)

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    try { localStorage.setItem("enclave-theme", theme) } catch {}
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"))
  }, [])

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }))
      setDate(now.toISOString().slice(0, 10))
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [])

  // Live telemetry
  useEffect(() => {
    const i = setInterval(() => {
      setCpu(18 + Math.floor(Math.random() * 14))
      setStorage(45 + Math.floor(Math.random() * 6))
      setTemp(56 + Math.floor(Math.random() * 8))
    }, 2800)
    return () => clearInterval(i)
  }, [])

  // Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const settings = useEnclaveSettings()

  // Module cards hidden from Options disappear from the portal too.
  const visibleApps = useMemo(
    () => APPS.filter((app) => !app.route || !settings.disabledModules.includes(app.id)),
    [settings.disabledModules],
  )

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return visibleApps.filter((app) => {
      const matchesCategory = selectedCategory === "all" || app.category === selectedCategory
      const matchesSearch =
        q === "" ||
        app.name.toLowerCase().includes(q) ||
        app.codename.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [visibleApps, selectedCategory, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: visibleApps.length }
    visibleApps.forEach((app) => { counts[app.category] = (counts[app.category] || 0) + 1 })
    return counts
  }, [visibleApps])

  const onlineCount = useMemo(() => visibleApps.filter((a) => a.status === "online").length, [visibleApps])
  const totalCount = visibleApps.length
  const totalCategories = Object.keys(CATEGORIES).length

  const filterLabel = selectedCategory === "all" ? "" : (CATEGORIES[selectedCategory]?.label ?? "").toUpperCase()
  const showingLabel =
    `SHOWING ${filteredApps.length} APPLICATION${filteredApps.length === 1 ? "" : "S"}`

  return (
    <div
      className="portal-root"
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
        color: "var(--fg)",
        overflow: "hidden",
      }}
    >
      {/* ─────────── SIDEBAR ─────────── */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "18px 16px 16px" }}>
          <div
            style={{
              width: 30,
              height: 30,
              flexShrink: 0,
              borderRadius: 8,
              background: "var(--bg-3)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--portal-mono)",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--amber)",
            }}
          >
            E
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <span
              style={{
                fontFamily: "var(--portal-mono)",
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: "var(--fg)",
                textTransform: "uppercase",
              }}
            >
              Enclave Systems
            </span>
            <span
              style={{
                fontFamily: "var(--portal-mono)",
                fontSize: 7.5,
                fontWeight: 500,
                letterSpacing: "0.05em",
                color: "var(--fg-4)",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Unified Application Portal v1.0.0
            </span>
          </div>
        </div>

        {/* Scrollable sections */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "6px 12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 6px 8px" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--amber)" }} />
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--fg-4)",
                  fontWeight: 600,
                }}
              >
                Categories
              </span>
            </div>
            <CategoryNav selected={selectedCategory} onSelect={setSelectedCategory} counts={categoryCounts} />
          </div>

          <StatusPanel
            onlineCount={onlineCount}
            totalCount={totalCount}
            storage={storage}
            temp={temp}
          />
        </div>

      </aside>

      {/* ─────────── MAIN COLUMN ─────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <TerminalHeader time={time} date={date} cpu={cpu} theme={theme} onToggleTheme={toggleTheme} />

        {/* Scrollable content */}
        <main style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
          {/* Dotted backdrop */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: "radial-gradient(var(--fg-5) 1px, transparent 1.5px)",
              backgroundSize: "26px 26px",
              opacity: 0.14,
            }}
          />

          <div style={{ position: "absolute", inset: 0, overflowY: "auto" }}>
            <div style={{ position: "relative", padding: "34px 40px 28px" }}>
              {/* Page header */}
              <div style={{ marginBottom: 22 }}>
                <div
                  style={{
                    fontFamily: "var(--portal-mono)",
                    fontSize: 10.5,
                    letterSpacing: "0.18em",
                    color: "var(--fg-4)",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  // SHELL · UNIFIED APPLICATION PORTAL V1.0.0
                </div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 40,
                    fontWeight: 650,
                    letterSpacing: "-0.02em",
                    color: "var(--fg)",
                    lineHeight: 1.1,
                  }}
                >
                  Portal<span style={{ color: "var(--amber)" }}>.</span>
                </h1>
                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: 14,
                    color: "var(--fg-3)",
                    maxWidth: 560,
                    lineHeight: 1.55,
                  }}
                >
                  Every Enclave system in one place. Search, monitor and launch your self-hosted applications.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    marginTop: 14,
                    fontFamily: "var(--portal-mono)",
                    fontSize: 11,
                    color: "var(--fg-4)",
                  }}
                >
                  <span>
                    <span style={{ color: "var(--fg-2)", fontWeight: 600 }}>{totalCount}</span> apps
                  </span>
                  <span>
                    <span style={{ color: "var(--fg-2)", fontWeight: 600 }}>{totalCategories}</span> categories
                  </span>
                  <span>
                    <span style={{ color: "var(--success)", fontWeight: 600 }}>{onlineCount}</span> online
                  </span>
                </div>
                <div
                  style={{
                    position: "relative",
                    marginTop: 18,
                    height: 1,
                    background: "var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: -1,
                      height: 3,
                      width: 72,
                      borderRadius: 99,
                      background: "var(--amber)",
                    }}
                  />
                </div>
              </div>

              {/* Search */}
              <TerminalSearch
                query={searchQuery}
                onQueryChange={setSearchQuery}
                matchCount={filteredApps.length}
                inputRef={searchRef}
              />

              {/* Showing row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  margin: "16px 0 12px",
                  minHeight: 16,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--portal-mono)",
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    color: "var(--fg-4)",
                    textTransform: "uppercase",
                  }}
                >
                  {showingLabel}
                  {selectedCategory !== "all" && (
                    <>
                      <span> // FILTER: </span>
                      <span style={{ color: "var(--amber)" }}>{filterLabel}</span>
                    </>
                  )}
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      fontFamily: "var(--portal-mono)",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      color: "var(--fg-4)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-4)")}
                  >
                    [CLEAR SEARCH]
                  </button>
                )}
              </div>

              {/* App grid / empty state */}
              {filteredApps.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
                    gap: 14,
                  }}
                >
                  {filteredApps.map((app) => (
                    <AppCard key={app.id} app={app} onClick={() => setSelectedApp(app)} />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "72px 0",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--portal-mono)",
                      fontSize: 12,
                      letterSpacing: "0.16em",
                      color: "var(--fg-3)",
                      textTransform: "uppercase",
                    }}
                  >
                    No matching applications
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--portal-mono)",
                      fontSize: 10.5,
                      letterSpacing: "0.08em",
                      color: "var(--fg-5)",
                    }}
                  >
                    Adjust your search parameters or clearance level
                  </div>
                </div>
              )}

              {/* Credo */}
              <div
                style={{
                  marginTop: 48,
                  textAlign: "center",
                  fontFamily: "var(--portal-mono)",
                  fontSize: 9.5,
                  lineHeight: 2.1,
                  letterSpacing: "0.14em",
                  color: "var(--fg-5)",
                  textTransform: "uppercase",
                }}
              >
                Enclave — Unified Application Portal v1.0.0<br />
                Self-hosted // Authorized access only<br />
                Powered by Venator UI
              </div>
            </div>
          </div>
        </main>

        <TerminalLog />
      </div>

      <AppDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />
    </div>
  )
}
