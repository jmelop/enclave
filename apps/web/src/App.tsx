import { Routes, Route } from 'react-router-dom'
import { Portal } from '../components/portal'

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<Portal />} />
    </Routes>
  )
}
