import { useState } from 'react';
import {
  Modal, ModalContent, ModalFooter,
  Button, Input,
  useToast,
} from '@venator-ui/ui';
import { Check, ChevronRight, X } from 'lucide-react';
import type { BodyEntry } from '../types/workout';
import { useWorkoutStore } from '../store/workoutStore';

interface Props {
  onClose: () => void;
  defaultDate?: string;
  lastEntry?: BodyEntry;
  editId?: string;
  initial?: BodyEntry;
}

type OptMeasurements = {
  chest: string; hip: string;
  bicepL: string; bicepR: string;
  thighL: string; thighR: string;
};

export default function LogMeasurementModal({ onClose, defaultDate, lastEntry, editId, initial }: Props) {
  const { toast } = useToast();
  const addBodyEntry = useWorkoutStore(s => s.addBodyEntry);
  const updateBodyEntry = useWorkoutStore(s => s.updateBodyEntry);
  const isEdit = !!editId;
  const base = initial ?? lastEntry;

  const [date, setDate]     = useState(initial?.date ?? defaultDate ?? '2026-05-24');
  const [weight, setWeight] = useState(initial ? String(initial.weight) : '80.0');
  const [waist, setWaist]   = useState(base?.waist != null ? String(base.waist) : '');
  const [notes, setNotes]   = useState(initial?.notes ?? '');
  const [expanded, setExpanded] = useState(false);
  const [optM, setOptM] = useState<OptMeasurements>({
    chest:  base?.chest  != null ? String(base.chest)  : '',
    hip:    base?.hip    != null ? String(base.hip)    : '',
    bicepL: base?.bicepL != null ? String(base.bicepL) : '',
    bicepR: base?.bicepR != null ? String(base.bicepR) : '',
    thighL: base?.thighL != null ? String(base.thighL) : '',
    thighR: base?.thighR != null ? String(base.thighR) : '',
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const setOpt = (key: keyof OptMeasurements, val: string) =>
    setOptM(prev => ({ ...prev, [key]: val }));

  const submit = async () => {
    const errs: Record<string, boolean> = {};
    if (!date) errs.date = true;
    if (!weight || isNaN(Number(weight))) errs.weight = true;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload: Omit<BodyEntry, 'id'> = {
      date,
      weight: Number(weight),
      waist:  waist === '' ? undefined : Number(waist),
      chest:  optM.chest  === '' ? undefined : Number(optM.chest),
      hip:    optM.hip    === '' ? undefined : Number(optM.hip),
      bicepL: optM.bicepL === '' ? undefined : Number(optM.bicepL),
      bicepR: optM.bicepR === '' ? undefined : Number(optM.bicepR),
      thighL: optM.thighL === '' ? undefined : Number(optM.thighL),
      thighR: optM.thighR === '' ? undefined : Number(optM.thighR),
      notes:  notes.trim() || undefined,
    };

    setSaving(true);
    try {
      if (editId) await updateBodyEntry(editId, payload);
      else await addBodyEntry(payload);
      onClose();
      toast({ title: `Medición ${editId ? 'actualizada' : 'registrada'} · ${payload.weight} kg`, variant: 'success' });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Save failed', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const optField = (key: keyof OptMeasurements, label: string) => (
    <div key={key} className="flex flex-col gap-1.5">
      <label className="wm-label">
        {label} <span className="text-fg-5 ml-1 normal-case font-normal">cm</span>
      </label>
      <Input
        type="number" step="0.1"
        value={optM[key]}
        onChange={e => setOpt(key, e.target.value)}
        placeholder="—"
        className="wm-mono"
      />
    </div>
  );

  return (
    <Modal open onClose={onClose} size="md" className="workout-modal">
      <div className="wm-header">
        <h3 className="wm-title">{isEdit ? 'Edit body measurement' : 'New body measurement'}</h3>
        <button type="button" className="wm-close" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>
      </div>

      <ModalContent className="overflow-y-auto max-h-[70vh] !px-[22px] !py-5">
        {/* Date / weight / waist */}
        <div className="flex gap-3 mb-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="wm-label">Date</label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              error={errors.date}
              className="wm-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="wm-label">
              Body weight <span className="text-fg-5 ml-1 normal-case font-normal">kg</span>
            </label>
            <Input
              type="number" step="0.1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="80.0"
              error={errors.weight}
              className="wm-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="wm-label">
              Waist <span className="text-fg-5 ml-1 normal-case font-normal">cm</span>
            </label>
            <Input
              type="number" step="0.1"
              value={waist}
              onChange={e => setWaist(e.target.value)}
              placeholder="—"
              className="wm-mono"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5 mb-2">
          <label className="wm-label">Notes</label>
          <Input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Cardio extra, refeed, sleep quality…"
          />
        </div>

        {/* Optional measurements toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 py-3 text-[12px] font-semibold uppercase tracking-[0.5px] text-fg-3 cursor-pointer bg-transparent border-0 w-full text-left"
        >
          <ChevronRight
            size={12}
            style={{ transition: 'transform 150ms ease', transform: expanded ? 'rotate(90deg)' : 'none' }}
          />
          Optional measurements
        </button>

        <div style={{
          display: 'grid',
          gridTemplateRows: expanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 220ms ease',
        }}>
          <div style={{ overflow: 'hidden' }}>
            <div className="grid gap-3 pt-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {optField('chest',  'Chest')}
              {optField('hip',    'Hip')}
              <div />
              {optField('bicepL', 'Bicep L')}
              {optField('bicepR', 'Bicep R')}
              <div />
              {optField('thighL', 'Thigh L')}
              {optField('thighR', 'Thigh R')}
            </div>
          </div>
        </div>
      </ModalContent>

      <ModalFooter className="!px-[22px]">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={() => void submit()} disabled={saving}>
          <Check size={14} /> {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save measurement'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
