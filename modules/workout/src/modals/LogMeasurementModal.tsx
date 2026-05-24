import { useState } from 'react';
import {
  Modal, ModalHeader, ModalContent, ModalFooter,
  Button, Input, Label,
  useToast,
} from '@venator-ui/ui';
import { Check, ChevronRight } from 'lucide-react';
import type { BodyEntry } from '../data/data';

interface Props {
  onClose: () => void;
  onSubmit: (e: BodyEntry) => void;
  defaultDate?: string;
  lastMeasurements?: BodyEntry['measurements'];
}

type OptMeasurements = {
  chest: string; hip: string;
  bicepL: string; bicepR: string;
  thighL: string; thighR: string;
};

export default function LogMeasurementModal({ onClose, onSubmit, defaultDate, lastMeasurements }: Props) {
  const { toast } = useToast();
  const [date, setDate]     = useState(defaultDate ?? '2026-05-24');
  const [weight, setWeight] = useState('80.0');
  const [waist, setWaist]   = useState(lastMeasurements?.waist != null ? String(lastMeasurements.waist) : '');
  const [notes, setNotes]   = useState('');
  const [expanded, setExpanded] = useState(false);
  const [optM, setOptM] = useState<OptMeasurements>({
    chest:  lastMeasurements?.chest  != null ? String(lastMeasurements.chest)  : '',
    hip:    lastMeasurements?.hip    != null ? String(lastMeasurements.hip)    : '',
    bicepL: lastMeasurements?.bicepL != null ? String(lastMeasurements.bicepL) : '',
    bicepR: lastMeasurements?.bicepR != null ? String(lastMeasurements.bicepR) : '',
    thighL: lastMeasurements?.thighL != null ? String(lastMeasurements.thighL) : '',
    thighR: lastMeasurements?.thighR != null ? String(lastMeasurements.thighR) : '',
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const setOpt = (key: keyof OptMeasurements, val: string) => {
    setOptM(prev => ({ ...prev, [key]: val }));
  };

  const submit = () => {
    const errs: Record<string, boolean> = {};
    if (!date) errs.date = true;
    if (!weight || isNaN(Number(weight))) errs.weight = true;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const entry: BodyEntry = {
      date,
      weight: Number(weight),
      waist:  waist === '' ? undefined : Number(waist),
      notes:  notes.trim() || undefined,
    };

    const hasOpt = Object.values(optM).some(v => v !== '' && !isNaN(Number(v)));
    if (hasOpt || waist !== '') {
      entry.measurements = {
        chest:  optM.chest  === '' ? undefined : Number(optM.chest),
        waist:  waist       === '' ? undefined : Number(waist),
        hip:    optM.hip    === '' ? undefined : Number(optM.hip),
        bicepL: optM.bicepL === '' ? undefined : Number(optM.bicepL),
        bicepR: optM.bicepR === '' ? undefined : Number(optM.bicepR),
        thighL: optM.thighL === '' ? undefined : Number(optM.thighL),
        thighR: optM.thighR === '' ? undefined : Number(optM.thighR),
      };
    }

    onSubmit(entry);
    toast({
      title: `Medición registrada · ${entry.weight} kg`,
      variant: 'success',
    });
  };

  const optField = (key: keyof OptMeasurements, label: string) => (
    <div key={key} className="flex flex-col gap-1.5">
      <Label>
        {label} <span className="text-fg-5 ml-1">cm</span>
      </Label>
      <Input
        type="number"
        step="0.1"
        value={optM[key]}
        onChange={e => setOpt(key, e.target.value)}
        placeholder="—"
        className="font-mono"
      />
    </div>
  );

  return (
    <Modal open onClose={onClose} size="md">
      <ModalHeader title="New body measurement" tag="LOG MEASUREMENT" onClose={onClose} />

      <ModalContent className="overflow-y-auto max-h-[70vh]">
        {/* Date / weight / waist */}
        <div className="flex gap-3 mb-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="meas-date">Date</Label>
            <Input
              id="meas-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              error={errors.date}
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="meas-weight">
              Body weight <span className="text-fg-5 ml-1">kg</span>
            </Label>
            <Input
              id="meas-weight"
              type="number"
              step="0.1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="80.0"
              error={errors.weight}
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="meas-waist">
              Waist <span className="text-fg-5 ml-1">cm</span>
            </Label>
            <Input
              id="meas-waist"
              type="number"
              step="0.1"
              value={waist}
              onChange={e => setWaist(e.target.value)}
              placeholder="—"
              className="font-mono"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5 mb-2">
          <Label htmlFor="meas-notes">Notes</Label>
          <Input
            id="meas-notes"
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
            style={{
              transition: 'transform 150ms ease',
              transform: expanded ? 'rotate(90deg)' : 'none',
            }}
          />
          Optional measurements
        </button>

        {/* Animated grid collapse */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: expanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 220ms ease',
          }}
        >
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

      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={submit}>
          <Check size={14} />
          Save measurement
        </Button>
      </ModalFooter>
    </Modal>
  );
}
