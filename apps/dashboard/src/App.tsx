import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { Portal } from '../components/portal'
import { EnclaveNav, type ExternalLink } from '../components/enclave-nav'
import { APPS } from '../lib/apps-data'
import { portfolioClient } from '../../../modules/portfolio/module/client.config'
import { inventoryClient } from '../../../modules/inventory/module/client.config'
import { workoutClient } from '../../../modules/workout/module/client.config'
import { budgetClient } from '../../../modules/budget/module/client.config'
import { labClient }      from '../../../modules/lab/module/client.config'
import { strategyClient } from '../../../modules/strategy/module/client.config'

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
    children: [
      { path: portfolioClient.basePath, children: portfolioClient.routes },
      { path: inventoryClient.basePath, children: inventoryClient.routes },
      { path: workoutClient.basePath, children: workoutClient.routes },
      { path: budgetClient.basePath, children: budgetClient.routes },
      { path: labClient.basePath,      children: labClient.routes },
      { path: strategyClient.basePath, children: strategyClient.routes },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
