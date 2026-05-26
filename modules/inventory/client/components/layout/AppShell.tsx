import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('enclave-theme') ?? 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('enclave-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar theme={theme} onTheme={toggleTheme} />
        {children}
      </main>
    </div>
  )
}
