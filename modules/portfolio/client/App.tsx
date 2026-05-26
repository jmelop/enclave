import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Portfolio } from './pages/Portfolio'

export default function App() {
  return (
    <div className="v-shell">
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/portfolio" replace />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route
            path="*"
            element={
              <main className="v-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--fg-3)' }}>
                  <p style={{ fontSize: 30, fontWeight: 600, color: 'var(--fg)', margin: '0 0 8px' }}>404</p>
                  <p style={{ margin: 0, fontSize: 13 }}>Page not found</p>
                </div>
              </main>
            }
          />
        </Routes>
      </AppShell>
    </div>
  )
}
