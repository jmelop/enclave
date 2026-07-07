import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { Portal } from '../components/portal'
import { EnclaveNav, type ExternalLink } from '../components/enclave-nav'
import { APPS } from '../lib/apps-data'
import { clientModules } from '../../../enclave.modules.client'

const externalLinks: ExternalLink[] = APPS
  .filter(a => a.url)
  .map(a => ({ id: a.id, label: a.name, url: a.url! }))

function ModuleLayout() {
  return (
    <div className="flex h-screen">
      <div className="module-nav w-60 shrink-0 border-r border-[var(--border-subtle)]">
        <EnclaveNav externalLinks={externalLinks} />
      </div>
      <div className="module-content flex-1 min-w-0 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <Portal /> },
  {
    element: <ModuleLayout />,
    children: clientModules.map((mod) =>
      // Modules that route internally (descendant <Routes>) mount as a flat
      // splat — a child `{ path: '*' }` would not match the module root.
      mod.routes.length === 1 && mod.routes[0].path === '*'
        ? { path: `${mod.basePath}/*`, element: mod.routes[0].element }
        : { path: mod.basePath, children: mod.routes },
    ),
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
