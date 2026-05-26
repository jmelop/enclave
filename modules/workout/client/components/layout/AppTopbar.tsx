import { Breadcrumb, BreadcrumbItem, Switch } from '@venator-ui/ui';
import { Sun, Moon } from 'lucide-react';

interface AppTopbarProps {
  theme: 'slate-dark' | 'slate-light';
  onToggleTheme: () => void;
  section: string;
}

export default function AppTopbar({ theme, onToggleTheme, section }: AppTopbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 w-full">
      <Breadcrumb separator="/">
        <BreadcrumbItem>enclave</BreadcrumbItem>
        <BreadcrumbItem>workout</BreadcrumbItem>
        <BreadcrumbItem active>{section}</BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-fg-4 px-2 py-[3px] rounded border border-[var(--border-subtle)] bg-bg-1"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-success"
            style={{ boxShadow: '0 0 8px var(--success)' }}
          />
          synced · 4m ago
        </span>

        <div className="flex items-center gap-2">
          <Sun size={13} className="text-fg-4" />
          <Switch
            checked={theme === 'slate-light'}
            onCheckedChange={onToggleTheme}
          />
          <Moon size={13} className="text-fg-4" />
        </div>
      </div>
    </div>
  );
}
