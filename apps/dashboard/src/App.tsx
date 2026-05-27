import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Portal } from '../components/portal'
import { portfolioClient } from '../../../modules/portfolio/module/client.config'
import { inventoryClient } from '../../../modules/inventory/module/client.config'
import { workoutClient } from '../../../modules/workout/module/client.config'

const router = createBrowserRouter([
  { path: '/', element: <Portal /> },
  { path: portfolioClient.basePath, children: portfolioClient.routes },
  { path: inventoryClient.basePath, children: inventoryClient.routes },
  { path: workoutClient.basePath, children: workoutClient.routes },
])

export default function App() {
  return <RouterProvider router={router} />
}
