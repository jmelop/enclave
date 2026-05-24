import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@venator-ui/patterns';
import Sidebar from './components/layout/Sidebar';
import AppTopbar from './components/layout/AppTopbar';
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

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'slate-dark' ? 'slate-light' : 'slate-dark'));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '1') navigate('/');
      if (e.key === '2') navigate('/workouts');
      if (e.key === '3') navigate('/body');
      if (e.key.toLowerCase() === 't') toggleTheme();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate, toggleTheme]);

  const addWorkout = useCallback((w: WorkoutEntry) => {
    setWorkouts(prev => [w, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  const addBodyEntry = useCallback((e: BodyEntry) => {
    setBodyLog(prev => [...prev, e].sort((a, b) => a.date.localeCompare(b.date)));
  }, []);

  const sectionLabel = (() => {
    if (location.pathname === '/') return 'overview';
    return location.pathname.slice(1);
  })();

  return (
    <DashboardLayout
      sidebarWidth="240px"
      sidebar={<Sidebar />}
      header={<AppTopbar theme={theme} onToggleTheme={toggleTheme} section={sectionLabel} />}
      contentPadding="p-6 pb-16"
      contentClassName="!bg-bg content-scroll"
    >
      <Routes>
        <Route path="/" element={<OverviewPage workouts={workouts} bodyLog={bodyLog} />} />
        <Route path="/workouts" element={<WorkoutsPage workouts={workouts} onAddWorkout={addWorkout} />} />
        <Route path="/body" element={<BodyPage bodyLog={bodyLog} onAddEntry={addBodyEntry} />} />
      </Routes>
    </DashboardLayout>
  );
}
