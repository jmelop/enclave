import { useLocation, useNavigate } from 'react-router-dom'
import { NavGroup, NavItem, Badge } from '@venator-ui/ui'
import { Icon } from '../Icon'
import { usePortfolioStore } from '../../store/portfolioStore'
import type { ReactNode } from 'react'

interface SidebarLinkProps {
  to: string
  icon: string
  label: string
  trail?: string
}

function SidebarLink({ to, icon, label, trail }: SidebarLinkProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active = pathname === to || (to === '/portfolio' && pathname === '/')

  return (
    <div style={{ position: 'relative' }}>
      <NavItem
        label={label}
        icon={<Icon name={icon} size={16} />}
        active={active}
        onClick={() => navigate(to)}
      />
      {trail && (
        <span style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}>
          <Badge variant="default" size="sm" className="font-mono rounded">{trail}</Badge>
        </span>
      )}
    </div>
  )
}

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const assets = usePortfolioStore((s) => s.assets)

  return (
    <>
      <div className="bg-layer bg-mesh" aria-hidden="true" />

      <aside className="v-side">
        <div className="v-brand">
          <div className="v-brand-mark">E</div>
          <div className="v-brand-name">
            Enclave <span>/ personal</span>
          </div>
        </div>

        <NavGroup label="Workspace">
          <SidebarLink to="/"          icon="home"   label="Overview" />
          <SidebarLink to="/portfolio" icon="wallet" label="Portfolio" trail={String(assets.length)} />
          <SidebarLink to="/habits"    icon="bolt"   label="Habits" />
          <SidebarLink to="/lab"       icon="flask"  label="Lab" />
        </NavGroup>

        <NavGroup label="System">
          <SidebarLink to="/notifications" icon="bell" label="Notifications" />
          <SidebarLink to="/settings"      icon="cog"  label="Settings" />
        </NavGroup>

        <div className="v-side-foot">
          <div className="v-avatar">JM</div>
          <div>
            <div className="v-user-name">Juan Melo</div>
            <div className="v-user-meta">v0.1.0</div>
          </div>
        </div>
      </aside>

      {children}
    </>
  )
}
