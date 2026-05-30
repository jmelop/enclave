import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import OverviewPage from './pages/OverviewPage';
import WorkoutsPage from './pages/WorkoutsPage';
import BodyPage from './pages/BodyPage';
import { WORKOUTS, BODY_LOG } from './data/data';
import type { WorkoutEntry, BodyEntry } from './data/data';

type Theme = 'slate-dark' | 'slate-light';

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'slate-dark';
  });
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>(WORKOUTS);
  const [bodyLog, setBodyLog] = useState<BodyEntry[]>(BODY_LOG);
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    return () => { document.documentElement.removeAttribute('data-theme'); };
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'slate-dark' ? 'slate-light' : 'slate-dark'));
  }, []);

  const addWorkout = useCallback((w: WorkoutEntry) => {
    setWorkouts(prev => [w, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  const addBodyEntry = useCallback((e: BodyEntry) => {
    setBodyLog(prev => [...prev, e].sort((a, b) => a.date.localeCompare(b.date)));
  }, []);

  const sectionLabel = (() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last || last === 'workout') return 'overview';
    return last;
  })();

  const now = new Date().toISOString().slice(0, 10);

  return (
    <div data-theme={theme} style={{ background: 'var(--bg)', color: 'var(--fg)', minHeight: '100%' }}>
      <div className="canvas with-grid">
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
        <header className="hero">
          <div className="hero-tag mono">// MODULE · enclave-workout</div>
          <div className="hero-row">
            <h1 className="hero-title">Workout<span className="hero-dot">.</span></h1>
          </div>
          <div className="hero-sub">
            Track your training — sessions, exercises, and body composition over time.
          </div>
        </header>
        <Routes>
          <Route index element={<OverviewPage workouts={workouts} bodyLog={bodyLog} />} />
          <Route path="workouts" element={<WorkoutsPage workouts={workouts} onAddWorkout={addWorkout} />} />
          <Route path="body" element={<BodyPage bodyLog={bodyLog} onAddEntry={addBodyEntry} />} />
        </Routes>
      </div>
    </div>
  );
}
