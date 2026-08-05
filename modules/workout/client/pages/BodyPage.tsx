import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { StatCard } from '@venator-ui/patterns';
import { Button, Separator, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, useToast } from '@venator-ui/ui';
import { Plus } from 'lucide-react';
import LineChart, { ChartLegend } from '../components/LineChart';
import LogMeasurementModal from '../modals/LogMeasurementModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { FreshnessChips, TrendChips } from '../components/FreshnessChips';
import { HeroActions } from '../components/HeroActions';
import { useWorkoutStore } from '../store/workoutStore';
import { formatDate, todayIso } from '../lib/workoutUtils';
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
  const { entries, trend, summary } = useWorkoutStore(s => s.body);
  const [modal, setModal] = useState<ModalState | null>(null);
  // Hover and legend live here so both stacked panels share one cursor.
  const [hover, setHover] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const latest = entries[entries.length - 1];

  // Two stacked panels sharing an x-domain, not a dual Y axis: independent
  // autoscaling made the two lines look correlated whatever the real magnitudes.
  const chart = useMemo(() => {
    const labels = trend.map(t => formatDate(t.date, { short: true }));
    const weight = [
      {
        key: 'raw', label: 'weight (raw)', unit: 'kg',
        values: trend.map(t => t.weight),
        color: 'var(--accent)', opacity: 0.25, width: 1.5, dots: false,
      },
      {
        key: 'ma7', label: '7-day average', unit: 'kg',
        // null below the 4-entry gate: the line is absent, not interpolated.
        values: trend.map(t => t.ma7),
        color: 'var(--accent)', width: 2.5, gaps: 'break' as const,
        dashed: trend.map(t => t.ma7Partial),
      },
    ];
    const waist = [
      {
        key: 'waist', label: 'waist', unit: 'cm',
        // bridge: days without a waist reading join across, never drop to zero.
        values: trend.map(t => t.waist),
        color: 'var(--fg-3)', width: 2, gaps: 'bridge' as const,
      },
    ];
    return { labels, weight, waist, all: [...weight, ...waist] };
  }, [trend]);

  const chartNote = (i: number) => {
    const t = trend[i];
    if (!t || t.ma7 == null) return null;
    return `average of ${t.ma7Count} ${t.ma7Count === 1 ? 'reading' : 'readings'}${t.ma7Partial ? ' · partial' : ''}`;
  };

  const visible = (s: { key: string }) => !hidden[s.key];
  const toggleSeries = (key: string) => setHidden(h => ({ ...h, [key]: !h[key] }));

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
            defaultDate={todayIso()}
            daysSinceWaist={summary.daysSinceWaist}
          />
        )}
      </>
    );
  }

  const { minWeight: minW, maxWeight: maxW, totalDelta, count } = summary;
  const delta = totalDelta == null ? null : totalDelta.toFixed(1);
  const first = entries[0];

  return (
    <>
      <HeroActions>
        <Button variant="primary" size="sm" onClick={() => setModal({})}>
          <Plus size={14} />
          Log Measurement
        </Button>
      </HeroActions>

      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-sm text-fg-3">
          {count} {count === 1 ? 'entry' : 'entries'}
          {first && count > 1 && ` · ${formatDate(first.date, { short: true })} → ${formatDate(latest.date, { short: true })}`}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <TrendChips weeklyDelta={summary.weeklyDelta} weeklyDeltaDays={summary.weeklyDeltaDays} waistPerKg={summary.waistPerKg} />
          <FreshnessChips
            daysSinceWeight={summary.daysSinceWeight}
            daysSinceWaist={summary.daysSinceWaist}
          />
        </div>
      </div>

      {/* Weight chart */}
      <div
        className="bg-bg-1 border border-[var(--border-subtle)] rounded-lg overflow-hidden mb-4"
      >
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-[13px] font-semibold text-fg-2 m-0">Body composition</h3>
            <span className="text-[11px] text-fg-4">
              {first && count > 1
                ? `${formatDate(first.date, { short: true })} → ${formatDate(latest.date, { short: true })} · ${count} measurements`
                : `${formatDate(latest.date, { short: true })} · 1 measurement`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-fg-4">min {minW}</span>
            <span className="font-mono text-[11px] text-fg-4">max {maxW}</span>
            {/* Neutral on purpose: during a bulk, losing weight is not "good".
                The sign is the only signal — the app takes no view on direction. */}
            {delta != null && (
              <Badge variant="default" className="font-mono">
                {Number(delta) > 0 ? `+${delta}` : delta} kg
              </Badge>
            )}
          </div>
        </div>
        <div className="px-[18px] pt-[18px] pb-2">
          <LineChart
            labels={chart.labels}
            series={chart.weight.filter(visible)}
            height={280}
            showXLabels={false}
            note={chartNote}
            hoverIndex={hover}
            onHoverChange={setHover}
            tooltipSeries={chart.all.filter(visible)}
          />
        </div>
        <div className="px-[18px] pb-[18px]">
          <LineChart
            labels={chart.labels}
            series={chart.waist.filter(visible)}
            height={120}
            hoverIndex={hover}
            onHoverChange={setHover}
            tooltip={false}
          />
          <ChartLegend series={chart.all} hidden={hidden} onToggle={toggleSeries} />
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
            {[...entries].reverse().map((b, i, arr) => {
              // deltaWeight comes from the service; trend is date-ascending, so
              // reverse the index to line it up with this descending table.
              const raw = trend[arr.length - 1 - i]?.deltaWeight ?? null;
              const dw = raw == null ? null : raw.toFixed(1);
              // Same rule as the total badge: no colour semantics on direction.
              const dwColor = raw == null ? 'var(--fg-4)' : 'var(--fg-2)';
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-fg-4">{formatDate(b.date)}</TableCell>
                  <TableCell className="font-mono">{b.weight.toFixed(1)} <span className="text-fg-4">kg</span></TableCell>
                  <TableCell className="font-mono">
                    {b.waist != null ? `${b.waist.toFixed(1)} ` : '—'}
                    {b.waist != null && <span className="text-fg-4">cm</span>}
                  </TableCell>
                  <TableCell className="font-mono" style={{ color: dwColor }}>
                    {dw == null ? '—' : raw! > 0 ? `+${dw}` : dw}
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
          defaultDate={todayIso()}
          lastEntry={latest}
          daysSinceWaist={summary.daysSinceWaist}
        />
      )}
    </>
  );
}
