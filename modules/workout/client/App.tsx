import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import OverviewPage from './pages/OverviewPage';
import WorkoutsPage from './pages/WorkoutsPage';
import BodyPage from './pages/BodyPage';
import { useWorkoutStore } from './store/workoutStore';

type Theme = 'slate-dark' | 'slate-light';

function enclaveToSlate(t: string | null): Theme {
  return t === 'light' ? 'slate-light' : 'slate-dark';
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    enclaveToSlate(document.documentElement.getAttribute('data-theme')),
  );
  const location = useLocation();

  const hydrate  = useWorkoutStore(s => s.hydrate);
  const refetch  = useWorkoutStore(s => s.refetch);
  const loading  = useWorkoutStore(s => s.loading);
  const error    = useWorkoutStore(s => s.error);
  const hydrated = useWorkoutStore(s => s.hydrated);

  useEffect(() => { void hydrate(); }, [hydrate]);

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'slate-dark' ? 'slate-light' : 'slate-dark'));
  }, []);

  useEffect(() => {
    const enclaveValue = theme === 'slate-light' ? 'light' : 'dark';
    // Only propagate changes made from this module's toggle; on mount the
    // attribute is already the source of truth we initialized from.
    if (document.documentElement.getAttribute('data-theme') !== enclaveValue) {
      document.documentElement.setAttribute('data-theme', enclaveValue);
      localStorage.setItem('enclave-theme', enclaveValue);
    }
  }, [theme]);

  const sectionLabel = (() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last || last === 'workout') return 'overview';
    return last;
  })();

  const now = new Date().toISOString().slice(0, 10);

  const topbar = (
    <div className="v-topbar">
      <span className="crumb">enclave</span>
      <span className="sep">/</span>
      <span className="crumb">workout</span>
      <span className="sep">/</span>
      <span className="crumb active">{sectionLabel}</span>
      <span className="v-cursor">▊</span>
      <span className="spacer" />
      <span className="pill"><span className="dot" />synced</span>
      <span style={{ color: 'var(--fg-5)' }}>·</span>
      <span>{now}</span>
      <span style={{ color: 'var(--fg-5)' }}>·</span>
      <button
        onClick={toggleTheme}
        title={theme === 'slate-dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ appearance: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', display: 'flex', alignItems: 'center', padding: 0 }}
      >
        {theme === 'slate-dark' ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="3.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1 1M11.8 11.8l1 1M11.8 3.2l-1 1M4.2 11.8l-1 1"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.5 9A6 6 0 0 1 7 2.5a6 6 0 1 0 6.5 6.5z"/>
          </svg>
        )}
      </button>
    </div>
  );

  const header = (
    <header className="hero">
      <div className="hero-tag mono">// MODULE · enclave-workout</div>
      <div className="hero-row">
        <h1 className="hero-title">Workout<span className="hero-dot">.</span></h1>
        <div className="hero-actions" id="workout-hero-actions" />
      </div>
      <div className="hero-sub">
        Track your training — sessions, exercises, and body composition over time.
      </div>
    </header>
  );

  if (loading && !hydrated) {
    return (
      <div data-theme={theme} style={{ background: 'var(--bg)', color: 'var(--fg)', minHeight: '100%' }}>
        <div className="canvas with-grid">
          {topbar}
          {header}
          <div style={{ display: 'grid', placeItems: 'center', height: 240, color: 'var(--fg-4)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (error && !hydrated) {
    return (
      <div data-theme={theme} style={{ background: 'var(--bg)', color: 'var(--fg)', minHeight: '100%' }}>
        <div className="canvas with-grid">
          {topbar}
          {header}
          <div style={{ display: 'grid', placeItems: 'center', height: 240 }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="mono" style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>
              <button className="btn btn-ghost" onClick={() => void refetch()}>Retry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-theme={theme} style={{ background: 'var(--bg)', color: 'var(--fg)', minHeight: '100%' }}>
      <div className="canvas with-grid">
        {topbar}
        {header}
        <Routes>
          <Route index element={<OverviewPage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="body" element={<BodyPage />} />
        </Routes>
      </div>
    </div>
  );
}
