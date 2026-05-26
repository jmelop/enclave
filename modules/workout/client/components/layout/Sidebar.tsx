import { useNavigate, useLocation } from 'react-router-dom';
import { NavGroup, NavItem, Badge } from '@venator-ui/ui';
import { LayoutDashboard, Dumbbell, Activity, BookOpen, CheckSquare, Clock } from 'lucide-react';

const MAIN_NAV = [
  { href: '/',         label: 'Overview',  icon: <LayoutDashboard size={16} />, hotkey: '1' },
  { href: '/workouts', label: 'Workouts',  icon: <Dumbbell size={16} />,        hotkey: '2' },
  { href: '/body',     label: 'Body',      icon: <Activity size={16} />,        hotkey: '3' },
];

const DISABLED_NAV = [
  { label: 'Reading', icon: <BookOpen size={16} /> },
  { label: 'Habits',  icon: <CheckSquare size={16} /> },
  { label: 'Time',    icon: <Clock size={16} /> },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-[22px] border-b border-[var(--border-subtle)]">
        <div
          className="w-7 h-7 rounded-[7px] grid place-items-center font-bold text-[13px] shrink-0"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            fontFamily: 'JetBrains Mono, monospace',
            boxShadow: '0 0 0 1px var(--border-default) inset',
          }}
        >
          /
        </div>
        <span className="text-[13px] font-semibold text-fg tracking-[0.2px]">
          enclave<span className="text-fg-4 font-medium">/workout</span>
        </span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-4">
        <NavGroup label="Module">
          {MAIN_NAV.map(({ href, label, icon, hotkey }) => (
            <div key={href} style={{ position: 'relative' }}>
              <NavItem
                label={label}
                icon={icon}
                active={pathname === href}
                onClick={() => navigate(href)}
                trail={
                  <Badge variant="default" size="sm" className="font-mono !rounded px-[5px] py-[1px] text-[10px]">
                    {hotkey}
                  </Badge>
                }
              />
            </div>
          ))}
        </NavGroup>

        <NavGroup label="Other Modules">
          <div className="opacity-50">
            {DISABLED_NAV.map(({ label, icon }) => (
              <NavItem key={label} label={label} icon={icon} disabled />
            ))}
          </div>
        </NavGroup>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-t border-[var(--border-subtle)]">
        <div
          className="w-7 h-7 rounded-full grid place-items-center text-white text-[11px] font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
        >
          MK
        </div>
        <div className="flex flex-col gap-[1px]">
          <span className="text-[12px] font-semibold text-fg-2">marcos.k</span>
          <span className="text-[11px] text-fg-4">enclave · v0.4.2</span>
        </div>
      </div>
    </div>
  );
}
