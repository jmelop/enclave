import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { StatCard } from '@venator-ui/patterns';
import { Button, Separator, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, useToast } from '@venator-ui/ui';
import { Plus } from 'lucide-react';
import LineChart from '../components/LineChart';
import LogMeasurementModal from '../modals/LogMeasurementModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { HeroActions } from '../components/HeroActions';
import { useWorkoutStore } from '../store/workoutStore';
import { formatDate } from '../lib/workoutUtils';
import type { BodyEntry } from '../types/workout';

type MeasKey = 'chest' | 'waist' | 'hip' | 'bicepL' | 'bicepR' | 'thighL' | 'thighR'

const BODY_CARDS: { key: MeasKey; label: string; unit: string }[] = [
  { key: 'chest',  label: 'Chest',       unit: 'cm' },
  { key: 'waist',  label: 'Waist',       unit: 'cm' },
  { key: 'hip',    label: 'Hip',         unit: 'cm' },
  { key: 'bicepL', label: 'Left Bicep',  unit: 'cm' },
  { key: 'bicepR', label: 'Right Bicep', unit: 'cm' },
  { key: 'thighL', label: 'Left Thigh',  unit: 'cm' },
  { key: 'thighR', label: 'Right Thigh', unit: 'cm' },
];

// ── Per-row ··· menu (Edit / Delete) ─────────────────────────────────────────

interface EntryRowMenuProps {
  entry: BodyEntry;
  onEdit: (entry: BodyEntry) => void;
}

function EntryRowMenu({ entry, onEdit }: EntryRowMenuProps) {
  const deleteBodyEntry = useWorkoutStore(s => s.deleteBodyEntry);
  const [dropOpen, setDropOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const openMenu = () => {
    if (dropOpen) { setDropOpen(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    setDropOpen(true);
  };

  useEffect(() => {
    if (!dropOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setDropOpen(false);
    };
    const onReflow = () => setDropOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
  }, [dropOpen]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBodyEntry(entry.id);
      setConfirmOpen(false);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Delete failed', variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        title="More options"
        onClick={openMenu}
        style={{
          display: 'grid', placeItems: 'center', width: 26, height: 26, padding: 0,
          borderRadius: 7, background: 'transparent', border: '1px solid var(--border-subtle)',
          color: 'var(--fg-3)', cursor: 'pointer', fontWeight: 700, fontSize: 14, letterSpacing: 1,
        }}
      >
        ···
      </button>
      {dropOpen && pos && createPortal(
        <div ref={menuRef} onClick={e => e.stopPropagation()} style={{
          position: 'fixed', top: pos.top, right: pos.right,
          minWidth: 120, zIndex: 1000,
          background: 'var(--bg-2)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          padding: '4px 0',
        }}>
          <button
            onClick={() => { setDropOpen(false); onEdit(entry); }}
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
        </div>,
        btnRef.current?.closest('[data-theme]') ?? document.body,
      )}
      <ConfirmDeleteModal
        open={confirmOpen}
        itemName={formatDate(entry.date, { short: true })}
        title="Delete measurement"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

// ── BodyPage ──────────────────────────────────────────────────────────────────

interface ModalState { editId?: string; initial?: BodyEntry }

export default function BodyPage() {
  const { bodyLog } = useWorkoutStore();
  const [modal, setModal] = useState<ModalState | null>(null);
  const latest = bodyLog[bodyLog.length - 1];

  const chartData = useMemo(() => (
    bodyLog.map(b => ({ label: formatDate(b.date, { short: true }), y: b.weight }))
  ), [bodyLog]);

  if (!latest) {
    return (
      <>
        <HeroActions>
          <Button variant="primary" size="sm" onClick={() => setModal({})}>
            <Plus size={14} />
            Log Measurement
          </Button>
        </HeroActions>

        <div className="flex items-center justify-between gap-4 mb-5">
          <p className="text-sm text-fg-3">No measurements logged yet</p>
        </div>
        <div className="bg-bg-1 border border-[var(--border-subtle)] rounded-lg p-10 text-center text-fg-4 text-sm">
          Log your first body measurement to start tracking progress over time.
        </div>
        {modal && (
          <LogMeasurementModal
            onClose={() => setModal(null)}
            editId={modal.editId}
            initial={modal.initial}
            defaultDate="2026-05-24"
          />
        )}
      </>
    );
  }

  const minW = Math.min(...bodyLog.map(b => b.weight));
  const maxW = Math.max(...bodyLog.map(b => b.weight));
  const delta = (latest.weight - bodyLog[0].weight).toFixed(1);

  return (
    <>
      <HeroActions>
        <Button variant="primary" size="sm" onClick={() => setModal({})}>
          <Plus size={14} />
          Log Measurement
        </Button>
      </HeroActions>

      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-sm text-fg-3">{bodyLog.length} entries · {formatDate(bodyLog[0].date, { short: true })} → {formatDate(latest.date, { short: true })}</p>
      </div>

      {/* Weight chart */}
      <div
        className="bg-bg-1 border border-[var(--border-subtle)] rounded-lg overflow-hidden mb-4"
      >
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-[13px] font-semibold text-fg-2 m-0">Body weight</h3>
            <span className="text-[11px] text-fg-4">
              {formatDate(bodyLog[0].date, { short: true })} → {formatDate(latest.date, { short: true })} · {bodyLog.length} measurements
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-fg-4">min {minW}</span>
            <span className="font-mono text-[11px] text-fg-4">max {maxW}</span>
            <Badge variant="success" className="font-mono">{delta} kg</Badge>
          </div>
        </div>
        <div className="p-[18px]">
          <LineChart data={chartData} height={280} unit="kg" />
        </div>
      </div>

      {/* Measurement divider */}
      <div className="flex items-center gap-3 my-6">
        <span className="text-[11px] uppercase tracking-[1px] text-fg-4 font-semibold whitespace-nowrap">
          Latest measurement — {formatDate(latest.date)}
        </span>
        <Separator />
      </div>

      {/* Measurement cards */}
      <div className="grid gap-2.5 mb-6" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {BODY_CARDS.map(c => {
          const val = latest[c.key];
          return (
            <StatCard
              key={c.key}
              title={c.label}
              value={
                val != null
                  ? <span className="font-mono">{(val as number).toFixed(1)}<span className="text-base text-fg-3 ml-1">{c.unit}</span></span>
                  : <span className="text-fg-4">—</span>
              }
              valueClassName="!text-xl"
            />
          );
        })}
      </div>

      {/* History table divider */}
      <div className="flex items-center gap-3 my-6">
        <span className="text-[11px] uppercase tracking-[1px] text-fg-4 font-semibold">History</span>
        <Separator />
      </div>

      {/* History table */}
      <div className="bg-bg-1 border border-[var(--border-subtle)] rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Waist</TableHead>
              <TableHead>Δ weight</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead style={{ width: 44 }} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...bodyLog].reverse().map((b, i, arr) => {
              const prev = arr[i + 1];
              const dw = prev ? (b.weight - prev.weight).toFixed(1) : null;
              const dwColor =
                dw == null ? 'var(--fg-4)'
                : Number(dw) < 0 ? 'var(--success)'
                : Number(dw) > 0 ? 'var(--warn)'
                : 'var(--fg-4)';
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-fg-4">{formatDate(b.date)}</TableCell>
                  <TableCell className="font-mono">{b.weight.toFixed(1)} <span className="text-fg-4">kg</span></TableCell>
                  <TableCell className="font-mono">
                    {b.waist != null ? `${b.waist.toFixed(1)} ` : '—'}
                    {b.waist != null && <span className="text-fg-4">cm</span>}
                  </TableCell>
                  <TableCell className="font-mono" style={{ color: dwColor }}>
                    {dw == null ? '—' : Number(dw) > 0 ? `+${dw}` : dw}
                  </TableCell>
                  <TableCell className="text-fg-4">{b.notes || '—'}</TableCell>
                  <TableCell>
                    <EntryRowMenu entry={b} onEdit={e => setModal({ editId: e.id, initial: e })} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {modal && (
        <LogMeasurementModal
          onClose={() => setModal(null)}
          editId={modal.editId}
          initial={modal.initial}
          defaultDate="2026-05-24"
          lastEntry={latest}
        />
      )}
    </>
  );
}
