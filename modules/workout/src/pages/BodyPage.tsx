import { useMemo, useState } from 'react';
import { PageHeader, StatCard } from '@venator-ui/patterns';
import { Button, Separator, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '@venator-ui/ui';
import { Plus } from 'lucide-react';
import LineChart from '../components/LineChart';
import LogMeasurementModal from '../modals/LogMeasurementModal';
import { formatDate } from '../data/data';
import type { BodyEntry } from '../data/data';

interface Props {
  bodyLog: BodyEntry[];
  onAddEntry: (e: BodyEntry) => void;
}

const BODY_CARDS: { key: keyof NonNullable<BodyEntry['measurements']>; label: string; unit: string }[] = [
  { key: 'chest',  label: 'Chest',     unit: 'cm' },
  { key: 'waist',  label: 'Waist',     unit: 'cm' },
  { key: 'hip',    label: 'Hip',       unit: 'cm' },
  { key: 'bicepL', label: 'Left Bicep',  unit: 'cm' },
  { key: 'bicepR', label: 'Right Bicep', unit: 'cm' },
  { key: 'thighL', label: 'Left Thigh',  unit: 'cm' },
  { key: 'thighR', label: 'Right Thigh', unit: 'cm' },
];

export default function BodyPage({ bodyLog, onAddEntry }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const latest = bodyLog[bodyLog.length - 1];
  const meas = latest.measurements ?? {};

  const chartData = useMemo(() => (
    bodyLog.map(b => ({ label: formatDate(b.date, { short: true }), y: b.weight }))
  ), [bodyLog]);

  const minW = Math.min(...bodyLog.map(b => b.weight));
  const maxW = Math.max(...bodyLog.map(b => b.weight));
  const delta = (latest.weight - bodyLog[0].weight).toFixed(1);

  const handleSubmit = (entry: BodyEntry) => {
    onAddEntry(entry);
    setModalOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Body Tracking"
        description={`${bodyLog.length} entries · ${formatDate(bodyLog[0].date, { short: true })} → ${formatDate(latest.date, { short: true })}`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} />
            Log Measurement
          </Button>
        }
        className="mb-5"
      />

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
          const val = meas[c.key];
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
                <TableRow key={b.date}>
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {modalOpen && (
        <LogMeasurementModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          defaultDate="2026-05-24"
          lastMeasurements={latest.measurements}
        />
      )}
    </>
  );
}
