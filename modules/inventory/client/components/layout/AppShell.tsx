import { type ReactNode } from 'react'
import { EnclaveNav } from '@enclave/ui-shell'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app">
      <EnclaveNav />
      <main className="main">
        {children}
      </main>
    </div>
  )
}
