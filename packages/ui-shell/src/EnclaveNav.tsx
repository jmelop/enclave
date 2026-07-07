import type { CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavGroup, NavItem } from '@venator-ui/ui';
import { House, LayoutDashboard, Dumbbell, Activity, Wallet, LayoutGrid, Receipt, CalendarDays, BarChart2, PieChart, Lightbulb, Code2, Kanban, Tag, Archive, RefreshCcw, Target, CheckSquare, BarChart3, FlaskConical } from 'lucide-react';
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
  'refresh-ccw':       <RefreshCcw size={16} />,
  'target':            <Target size={16} />,
  'check-square':      <CheckSquare size={16} />,
  'bar-chart-3':       <BarChart3 size={16} />,
  'flask-conical':     <FlaskConical size={16} />,
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
      <div className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-1">
        {/* Back to the shell portal */}
        <div
          className="flex flex-col gap-0.5"
          style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 2 }}
        >
          <NavItem
            label="Home"
            icon={<House size={16} />}
            active={pathname === '/'}
            onClick={() => navigate('/')}
          />
        </div>

        {clientModules.map((mod, i) => {
          const isModActive = pathname === mod.basePath || pathname.startsWith(mod.basePath + '/');
          return (
            <div key={mod.id}>
              {/* Module group header */}
              <div
                className="flex items-center gap-2 px-3 py-2 mt-1"
                style={i > 0 ? { borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '6px' } : undefined}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: isModActive ? mod.accent : 'var(--border-default)' }}
                />
                <span
                  className="text-[11px] font-semibold tracking-[0.06em] uppercase"
                  style={{ color: isModActive ? 'var(--fg-2)' : 'var(--fg-4)' }}
                >
                  {mod.navLabel}
                </span>
              </div>

              {/* Nav items */}
              <div className="flex flex-col gap-0.5">
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
              </div>
            </div>
          );
        })}

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
          AD
        </div>
        <div className="flex flex-col gap-[1px]">
          <span className="text-[12px] font-semibold text-fg-2">Alex Doe</span>
          <span className="text-[11px] text-fg-4">enclave · v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
