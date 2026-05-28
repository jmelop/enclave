import { EnclaveNav } from '@enclave/ui-shell'
import type { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <div className="bg-layer bg-mesh" aria-hidden="true" />
      <EnclaveNav />
      {children}
    </>
  )
}
