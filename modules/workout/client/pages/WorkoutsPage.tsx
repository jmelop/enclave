import { useState } from 'react';
import { Button, Badge, Separator, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from '@venator-ui/ui';
import { Plus, ChevronRight, Search } from 'lucide-react';
import LogWorkoutModal from '../modals/LogWorkoutModal';
import { workoutVolume, formatDate, dayOfWeek } from '../data/data';
import type { WorkoutEntry } from '../data/data';

interface Props {
  workouts: WorkoutEntry[];
  onAddWorkout: (w: WorkoutEntry) => void;
}

export default function WorkoutsPage({ workouts, onAddWorkout }: Props) {
  const [openId, setOpenId] = useState<string | null>(workouts[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = workouts.filter(w =>
    !query ||
    w.name.toLowerCase().includes(query.toLowerCase()) ||
    w.exercises.some(e => e.name.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSubmit = (w: WorkoutEntry) => {
    onAddWorkout(w);
    setModalOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-sm text-fg-3">{workouts.length} sessions logged — sorted by date</p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-4 pointer-events-none"
            />
            <Input
              placeholder="Search exercise or session…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-8 w-56 text-sm"
            />
          </div>
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} />
            Log Workout
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="bg-bg-1 border border-[var(--border-subtle)] rounded-lg p-10 text-center text-fg-4 text-sm">
            No sessions match &ldquo;{query}&rdquo;
          </div>
        )}

        {filtered.map((w, i) => {
          const open = openId === w.id;
          const vol = workoutVolume(w);
          const setCount = w.exercises.reduce((n, e) => n + e.sets.length, 0);

          return (
            <div
              key={w.id}
              className="bg-bg-1 border rounded-lg overflow-hidden transition-colors"
              style={{ borderColor: open ? 'var(--border-default)' : 'var(--border-subtle)' }}
            >
              {/* Row */}
              <button
                className="w-full grid items-center gap-4 px-[18px] py-3.5 text-left cursor-pointer bg-transparent border-0 color-inherit hover:bg-bg-2 transition-colors"
                style={{ gridTemplateColumns: '96px 1fr auto auto' }}
                onClick={() => setOpenId(open ? null : w.id)}
              >
                <span className="font-mono text-[12px] text-fg-3 tracking-[0.4px]">
                  {dayOfWeek(w.date).toUpperCase()} · {formatDate(w.date, { short: true })}
                </span>
                <span className="text-[14px] text-fg font-medium">
                  {w.name}
                  <span className="text-[11px] text-fg-4 ml-2 font-mono">
                    #{String(workouts.length - i).padStart(3, '0')}
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="default" size="sm">{w.exercises.length} exercises</Badge>
                  <Badge variant="default" size="sm">{setCount} sets</Badge>
                  <span
                    className="inline-flex items-center font-mono font-medium text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    {vol.toLocaleString()} kg
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  className="transition-transform duration-200 shrink-0"
                  style={{
                    color: open ? 'var(--accent)' : 'var(--fg-4)',
                    transform: open ? 'rotate(90deg)' : 'none',
                  }}
                />
              </button>

              {/* Expandable body */}
              <div
                className="expand-grid"
                style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <Separator />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: '44%' }}>Exercise</TableHead>
                        <TableHead style={{ width: '10%' }}>Sets</TableHead>
                        <TableHead>Reps</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead style={{ width: '14%' }}>Volume</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {w.exercises.map((ex, ei) => {
                        const exVol = ex.sets.reduce((n, s) => n + s.reps * s.kg, 0);
                        const repsLine = ex.sets.map(s => s.reps).join(' · ');
                        const kgLine   = ex.sets.map(s => s.kg).join(' · ');
                        return (
                          <TableRow key={ei}>
                            <TableCell>{ex.name}</TableCell>
                            <TableCell className="font-mono">{ex.sets.length}</TableCell>
                            <TableCell className="font-mono text-[12.5px]">{repsLine}</TableCell>
                            <TableCell className="font-mono text-[12.5px]">{kgLine}</TableCell>
                            <TableCell className="font-mono">{exVol.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <LogWorkoutModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          defaultDate="2026-05-24"
        />
      )}
    </>
  );
}
