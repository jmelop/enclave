// Standalone entry: wraps LabApp with the sidebar shell.
// In the dashboard the shell is provided by the dashboard itself,
// so client.config.tsx routes expose LabApp directly.
import { AppShell } from '@/components/layout/AppShell'
import LabApp from './LabApp'

export default function App() {
  return (
    <AppShell>
      <LabApp />
    </AppShell>
  )
}
