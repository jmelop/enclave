import { useState, useEffect, useRef } from 'react';
import { Button, Badge, Separator, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, useToast } from '@venator-ui/ui';
import { Plus, ChevronRight, Search } from 'lucide-react';
import LogWorkoutModal from '../modals/LogWorkoutModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useWorkoutStore } from '../store/workoutStore';
import { workoutVolume, formatDate, dayOfWeek } from '../lib/workoutUtils';
import type { WorkoutSession } from '../types/workout';

// ── Per-row ··· menu (Edit / Delete) ─────────────────────────────────────────

interface SessionRowMenuProps {
  session: WorkoutSession;
  onEdit: (session: WorkoutSession) => void;
}

function SessionRowMenu({ session, onEdit }: SessionRowMenuProps) {
  const deleteSession = useWorkoutStore(s => s.deleteSession);
  const [dropOpen, setDropOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSession(session.id);
      setConfirmOpen(false);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Delete failed', variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div ref={dropRef} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        title="More options"
        onClick={() => setDropOpen(o => !o)}
        style={{
          display: 'grid', placeItems: 'center', width: 26, height: 26, padding: 0,
          borderRadius: 7, background: 'transparent', border: '1px solid var(--border-subtle)',
          color: 'var(--fg-3)', cursor: 'pointer', fontWeight: 700, fontSize: 14, letterSpacing: 1,
        }}
      >
        ···
      </button>
      {dropOpen && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4,
          minWidth: 110, zIndex: 10,
          background: 'var(--bg-2)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          padding: '4px 0',
        }}>
          <button
            onClick={() => { setDropOpen(false); onEdit(session); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--fg-1)', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            Edit
          </button>
          <button
            onClick={() => { setDropOpen(false); setConfirmOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--danger)', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            Delete
          </button>
        </div>
      )}
      <ConfirmDeleteModal
        open={confirmOpen}
        itemName={session.name}
        title="Delete session"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

// ── WorkoutsPage ──────────────────────────────────────────────────────────────

interface ModalState { editId?: string; initial?: WorkoutSession }

export default function WorkoutsPage() {
  const { sessions } = useWorkoutStore();
  const [openId, setOpenId] = useState<string | null>(sessions[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<ModalState | null>(null);

  const filtered = sessions.filter(w =>
    !query ||
    w.name.toLowerCase().includes(query.toLowerCase()) ||
    w.exercises.some(e => e.name.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-sm text-fg-3">{sessions.length} sessions logged — sorted by date</p>
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
          <Button variant="primary" size="sm" onClick={() => setModal({})}>
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
              <div
                className="w-full grid items-center gap-4 px-[18px] py-3.5 text-left cursor-pointer hover:bg-bg-2 transition-colors"
                style={{ gridTemplateColumns: '96px 1fr auto auto auto' }}
                role="button"
                tabIndex={0}
                onClick={() => setOpenId(open ? null : w.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenId(open ? null : w.id); } }}
              >
                <span className="font-mono text-[12px] text-fg-3 tracking-[0.4px]">
                  {dayOfWeek(w.date).toUpperCase()} · {formatDate(w.date, { short: true })}
                </span>
                <span className="text-[14px] text-fg font-medium">
                  {w.name}
                  <span className="text-[11px] text-fg-4 ml-2 font-mono">
                    #{String(sessions.length - i).padStart(3, '0')}
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
                <SessionRowMenu session={w} onEdit={s => setModal({ editId: s.id, initial: s })} />
                <ChevronRight
                  size={16}
                  className="transition-transform duration-200 shrink-0"
                  style={{
                    color: open ? 'var(--accent)' : 'var(--fg-4)',
                    transform: open ? 'rotate(90deg)' : 'none',
                  }}
                />
              </div>

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

      {modal && (
        <LogWorkoutModal
          onClose={() => setModal(null)}
          editId={modal.editId}
          initial={modal.initial}
          defaultDate="2026-05-24"
        />
      )}
    </>
  );
}
