"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { APPS, type AppCategory, type AppEntry } from "@/lib/apps-data"
import { TerminalHeader } from "./terminal-header"
import { CategoryNav } from "./category-nav"
import { TerminalSearch } from "./terminal-search"
import { AppCard } from "./app-card"
import { StatusPanel } from "./status-panel"
import { TerminalLog } from "./terminal-log"
import { AppDetailModal } from "./app-detail-modal"
import { EnclaveEmblem } from "./enclave-emblem"

export function Portal() {
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedApp, setSelectedApp] = useState<AppEntry | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault()
        const input = document.querySelector<HTMLInputElement>('input[type="text"]')
        input?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const filteredApps = useMemo(() => {
    return APPS.filter((app) => {
      const matchesCategory =
        selectedCategory === "all" || app.category === selectedCategory
      const matchesSearch =
        searchQuery === "" ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.codename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: APPS.length }
    APPS.forEach((app) => {
      counts[app.category] = (counts[app.category] || 0) + 1
    })
    return counts
  }, [])

  const handleAppClick = useCallback((app: AppEntry) => {
    setSelectedApp(app)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[#0c0e0c] text-foreground font-mono relative overflow-hidden">
      {/* Header */}
      <div className="relative z-10 shrink-0">
        <TerminalHeader />
      </div>

      {/* Body: sidebar + main */}
      <div className="relative z-10 flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-border bg-[#0c0e0c] overflow-y-auto hidden lg:flex flex-col p-3 gap-6">
          <div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase mb-2">
              CATEGORIES
            </div>
            <CategoryNav
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              counts={categoryCounts}
            />
          </div>
          <StatusPanel />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#0c0e0c] relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 gap-4">
            <EnclaveEmblem className="w-[700px] h-[700px] text-foreground opacity-[0.07]" />
            <div className="text-[9px] text-muted-foreground/20 tracking-widest uppercase text-center leading-relaxed">
              Enclave — Unified Application Portal v1.0.0
              <br />
              Self-hosted // Authorized access only
              <br />
              Powered by Venator UI
            </div>
          </div>
          <div className="p-4 lg:p-6">
            <div className="mb-4">
              <TerminalSearch query={searchQuery} onQueryChange={setSearchQuery} />
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] text-muted-foreground tracking-widest uppercase">
                SHOWING {filteredApps.length} APPLICATION
                {filteredApps.length !== 1 ? "S" : ""}
                {selectedCategory !== "all" && (
                  <span>
                    {" "}// FILTER:{" "}
                    <span className="text-primary">
                      {selectedCategory.toUpperCase()}
                    </span>
                  </span>
                )}
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[10px] text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors"
                >
                  {"[CLEAR SEARCH]"}
                </button>
              )}
            </div>

            {filteredApps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredApps.map((app) => (
                  <div key={app.id} onClick={() => handleAppClick(app)}>
                    <AppCard app={app} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-muted-foreground text-sm tracking-widest uppercase mb-2">
                  No matching applications
                </div>
                <div className="text-[11px] text-muted-foreground/50 tracking-wider">
                  Adjust your search parameters or clearance level
                </div>
              </div>
            )}

            {/* Mobile status panel */}
            <div className="lg:hidden mt-4">
              <StatusPanel />
            </div>

          </div>
        </main>
      </div>

      {/* Terminal log docked at bottom */}
      <div className="relative z-10 shrink-0 border-t border-border">
        <TerminalLog />
      </div>

      <AppDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />
    </div>
  )
}
