import type { CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavGroup, NavItem } from '@venator-ui/ui';
import { LayoutDashboard, Dumbbell, Activity, Wallet, LayoutGrid, Receipt, CalendarDays, BarChart2, PieChart, Lightbulb, Code2, Kanban, Tag, Archive } from 'lucide-react';
import { clientModules } from '../../../enclave.modules.client';
import type { ModuleClientConfig } from '@enclave/sdk';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExternalLink {
  id: string;
  label: string;
  url: string;
}

interface Props {
  /** External app links (url-bearing entries from apps-data). Defaults to []. */
  externalLinks?: ExternalLink[];
}

// ─── Icon map ─────────────────────────────────────────────────────────────────
// Strings come from NavSection.icon in each module's client.config.

const ICON_MAP: Record<string, React.ReactNode> = {
  'wallet':            <Wallet size={16} />,
  'layout-dashboard':  <LayoutDashboard size={16} />,
  'dumbbell':          <Dumbbell size={16} />,
  'activity':          <Activity size={16} />,
  'grid':              <LayoutGrid size={16} />,
  'receipt':           <Receipt size={16} />,
  'calendar-days':     <CalendarDays size={16} />,
  'bar-chart-2':       <BarChart2 size={16} />,
  'pie-chart':         <PieChart size={16} />,
  'lightbulb':         <Lightbulb size={16} />,
  'code-2':            <Code2 size={16} />,
  'kanban':            <Kanban size={16} />,
  'tag':               <Tag size={16} />,
  'archive':           <Archive size={16} />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveHref(basePath: string, path: string): string {
  return path === '' ? basePath : `${basePath}/${path}`;
}

function findActiveModule(pathname: string): ModuleClientConfig | undefined {
  return clientModules
    .filter((m) => pathname === m.basePath || pathname.startsWith(m.basePath + '/'))
    .sort((a, b) => b.basePath.length - a.basePath.length)[0];
}

const DEFAULT_ACCENT = 'linear-gradient(135deg, #6b7280, #374151)';

// ─── Component ────────────────────────────────────────────────────────────────

export function EnclaveNav({ externalLinks = [] }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const activeMod = findActiveModule(pathname);
  const accent = activeMod?.accent ?? DEFAULT_ACCENT;

  return (
    <aside
      className="flex flex-col h-full"
      style={{ '--nav-accent': accent } as CSSProperties}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-[22px] border-b border-[var(--border-subtle)]">
        <div
          className="w-7 h-7 rounded-[7px] grid place-items-center font-bold text-[13px] text-white shrink-0"
          style={{ background: accent, fontFamily: 'JetBrains Mono, monospace' }}
        >
          E
        </div>
        <span className="text-[13px] font-semibold text-fg tracking-[0.2px]">
          enclave
          {activeMod && (
            <span className="text-fg-4 font-medium">
              /{activeMod.navLabel.toLowerCase()}
            </span>
          )}
        </span>
      </div>

      {/* Module nav */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-4">
        {clientModules.map((mod) => (
          <NavGroup key={mod.id} label={mod.navLabel}>
            {mod.nav.map((entry) => {
              const href = resolveHref(mod.basePath, entry.path);
              const isIndex = entry.path === '';
              const isActive = isIndex
                ? pathname === mod.basePath
                : pathname === href || pathname.startsWith(href + '/');
              return (
                <NavItem
                  key={href}
                  label={entry.label}
                  icon={entry.icon ? ICON_MAP[entry.icon] : undefined}
                  active={isActive}
                  onClick={() => navigate(href)}
                />
              );
            })}
          </NavGroup>
        ))}

        {externalLinks.length > 0 && (
          <NavGroup label="External">
            {externalLinks.map((link) => (
              <NavItem
                key={link.id}
                label={link.label}
                onClick={() =>
                  window.open(link.url, '_blank', 'noopener,noreferrer')
                }
              />
            ))}
          </NavGroup>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-t border-[var(--border-subtle)]">
        <div
          className="w-7 h-7 rounded-full grid place-items-center text-white text-[11px] font-bold shrink-0"
          style={{ background: accent }}
        >
          JM
        </div>
        <div className="flex flex-col gap-[1px]">
          <span className="text-[12px] font-semibold text-fg-2">Juan Melo</span>
          <span className="text-[11px] text-fg-4">enclave · v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
