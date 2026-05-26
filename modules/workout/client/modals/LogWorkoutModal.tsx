import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal, ModalHeader, ModalContent, ModalFooter,
  Button, Input, Label, Separator,
  useToast,
} from '@venator-ui/ui';
import { Check, Trash2, Plus, Minus } from 'lucide-react';
import { EXERCISE_LIBRARY } from '../data/data';
import type { WorkoutEntry } from '../data/data';

interface ExSet { reps: string; kg: string }
interface ExDraft { name: string; sets: ExSet[] }

interface Props {
  onClose: () => void;
  onSubmit: (w: WorkoutEntry) => void;
  defaultDate?: string;
}

export default function LogWorkoutModal({ onClose, onSubmit, defaultDate }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState('Push A');
  const [date, setDate] = useState(defaultDate ?? '2026-05-24');
  const [exercises, setExercises] = useState<ExDraft[]>([
    { name: 'Bench Press', sets: [{ reps: '5', kg: '92.5' }, { reps: '5', kg: '92.5' }, { reps: '5', kg: '92.5' }] },
  ]);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 80);
  }, []);

  const totalVolume = useMemo(() => {
    let total = 0;
    for (const ex of exercises) {
      for (const s of ex.sets) total += (Number(s.reps) || 0) * (Number(s.kg) || 0);
    }
    return Math.round(total);
  }, [exercises]);

  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0);

  const addExercise = () => {
    setExercises(prev => [...prev, { name: '', sets: [{ reps: '8', kg: '20' }] }]);
  };

  const removeExercise = (i: number) => {
    setExercises(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateExName = (i: number, n: string) => {
    setExercises(prev => prev.map((e, idx) => idx === i ? { ...e, name: n } : e));
  };

  const addSet = (ei: number) => {
    setExercises(prev => prev.map((e, idx) => {
      if (idx !== ei) return e;
      const last = e.sets[e.sets.length - 1] ?? { reps: '8', kg: '20' };
      return { ...e, sets: [...e.sets, { ...last }] };
    }));
  };

  const removeSet = (ei: number, si: number) => {
    setExercises(prev => prev.map((e, idx) => {
      if (idx !== ei) return e;
      return { ...e, sets: e.sets.filter((_, j) => j !== si) };
    }));
  };

  const updateSet = (ei: number, si: number, field: 'reps' | 'kg', value: string) => {
    setExercises(prev => prev.map((e, idx) => {
      if (idx !== ei) return e;
      return { ...e, sets: e.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) };
    }));
  };

  const submit = () => {
    const errs: Record<string, boolean> = {};
    if (!name.trim()) errs.name = true;
    if (!date) errs.date = true;
    const valid = exercises.filter(e => e.name.trim() && e.sets.length > 0);
    if (valid.length === 0) errs.exercises = true;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const entry: WorkoutEntry = {
      id: 'w' + Date.now(),
      date,
      name: name.trim(),
      exercises: valid.map(e => ({
        name: e.name.trim(),
        sets: e.sets.map(s => ({ reps: Number(s.reps) || 0, kg: Number(s.kg) || 0 })),
      })),
    };
    onSubmit(entry);
    toast({
      title: `Session "${entry.name}" logged`,
      description: `${entry.exercises.length} exercises · ${totalVolume.toLocaleString()} kg volume`,
      variant: 'success',
    });
  };

  return (
    <Modal open onClose={onClose} size="lg">
      <ModalHeader title="New workout session" tag="LOG WORKOUT" onClose={onClose} />

      <ModalContent className="overflow-y-auto max-h-[60vh]">
        {/* Name + date row */}
        <div className="flex gap-3 mb-4">
          <div className="flex flex-col gap-1.5 flex-[2]">
            <Label htmlFor="session-name">Session name</Label>
            <Input
              id="session-name"
              ref={nameRef}
              placeholder="Push A, Pull B, Legs…"
              value={name}
              onChange={e => setName(e.target.value)}
              error={errors.name}
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="session-date">Date</Label>
            <Input
              id="session-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              error={errors.date}
              className="font-mono"
            />
          </div>
        </div>

        {/* Exercises divider */}
        <div className="flex items-center gap-3 my-4">
          <span className="text-[11px] uppercase tracking-[1px] text-fg-4 font-semibold whitespace-nowrap">Exercises</span>
          <Separator />
        </div>

        <div className="flex flex-col gap-2.5">
          {exercises.map((ex, ei) => (
            <div
              key={ei}
              className="border border-[var(--border-subtle)] rounded-lg p-3 flex flex-col gap-2.5"
              style={{ background: 'var(--bg-2)' }}
            >
              {/* Exercise header */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-fg-4 min-w-[22px]">
                  {String(ei + 1).padStart(2, '0')}
                </span>
                <Input
                  list="exercise-options"
                  placeholder="Exercise name"
                  value={ex.name}
                  onChange={e => updateExName(ei, e.target.value)}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeExercise(ei)}
                  className="w-[26px] h-[26px] grid place-items-center rounded-[5px] border border-[var(--border-subtle)] text-fg-4 bg-transparent cursor-pointer transition-all hover:text-danger hover:border-danger hover:bg-[var(--danger-bg)] shrink-0"
                  title="Remove exercise"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Sets header */}
              <div className="grid items-center gap-2" style={{ gridTemplateColumns: '40px 1fr 1fr 28px' }}>
                <span className="text-[10px] uppercase tracking-[0.6px] text-fg-4 font-semibold">Set</span>
                <span className="text-[10px] uppercase tracking-[0.6px] text-fg-4 font-semibold">Reps</span>
                <span className="text-[10px] uppercase tracking-[0.6px] text-fg-4 font-semibold">Weight (kg)</span>
                <span />
              </div>

              {/* Set rows */}
              {ex.sets.map((s, si) => (
                <div key={si} className="grid items-center gap-2" style={{ gridTemplateColumns: '40px 1fr 1fr 28px' }}>
                  <span className="font-mono text-[12px] text-fg-4">{String(si + 1).padStart(2, '0')}</span>
                  <Input
                    type="number"
                    min="0"
                    value={s.reps}
                    onChange={e => updateSet(ei, si, 'reps', e.target.value)}
                    className="font-mono"
                    size="sm"
                  />
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={s.kg}
                    onChange={e => updateSet(ei, si, 'kg', e.target.value)}
                    className="font-mono"
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSet(ei, si)}
                    disabled={ex.sets.length <= 1}
                    className="w-[26px] h-[26px] grid place-items-center rounded-[5px] border border-[var(--border-subtle)] text-fg-4 bg-transparent cursor-pointer transition-all hover:bg-bg-3 hover:text-fg-2 disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <Minus size={12} />
                  </button>
                </div>
              ))}

              {/* Add set */}
              <button type="button" className="add-row-btn" onClick={() => addSet(ei)}>
                <Plus size={12} />
                Add set
              </button>
            </div>
          ))}
        </div>

        {/* Add exercise */}
        <button type="button" className="add-row-btn mt-3" onClick={addExercise}>
          <Plus size={12} />
          Add exercise
        </button>

        <datalist id="exercise-options">
          {EXERCISE_LIBRARY.map(n => <option key={n} value={n} />)}
        </datalist>
      </ModalContent>

      <ModalFooter>
        <div className="mr-auto flex gap-3.5 font-mono text-[11px] text-fg-4">
          <span>{exercises.length} ex · {totalSets} sets</span>
          <span style={{ color: 'var(--accent)' }}>{totalVolume.toLocaleString()} kg vol</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={submit}>
          <Check size={14} />
          Save session
        </Button>
      </ModalFooter>
    </Modal>
  );
}
