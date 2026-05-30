// Standalone entry: wraps BudgetApp with the sidebar shell.
// In the dashboard the shell is provided by the dashboard itself,
// so client.config.tsx routes expose BudgetApp directly.
import { AppShell } from '@/components/layout/AppShell';
import BudgetApp from './BudgetApp';

export default function App() {
  return (
    <AppShell>
      <BudgetApp />
    </AppShell>
  );
}
