import { useState } from 'react';
import { X } from 'lucide-react';
import { currentMonthKey } from '@/store/budgetStore';
import type { IncomeEntry, MonthData } from '@/types/budget';

interface Props {
  month: MonthData;
  initial?: IncomeEntry;
  onClose: () => void;
  onSave: (name: string, source: string, amount: number, day: number) => void;
}

function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function AddIncomeModal({ month, initial, onClose, onSave }: Props) {
  const isEdit = !!initial;

  const [name, setName]     = useState(initial?.name ?? '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [day, setDay]       = useState(initial ? String(initial.day) : String(month.asOfDay));

  const valid = name.trim().length > 0 && Number(amount) > 0;

  // Compute max day and label depending on mode and whether the month is current.
  const lastDayOfMonth = daysInMonth(month.key);
  const isCurrent = month.key === currentMonthKey();

  const maxDay = isEdit ? lastDayOfMonth : month.asOfDay;

  const dayLabel = isEdit
    ? 'Day of month'
    : isCurrent
      ? `Day of month · max today (${month.asOfDay})`
      : `Day of month (1 – ${month.asOfDay})`;

  const handleSave = () => {
    if (!valid) return;
    const parsedDay = Math.max(1, parseInt(day) || 1);
    onSave(
      name.trim(),
      source.trim(),
      Math.abs(parseFloat(amount)),
      Math.min(maxDay, parsedDay),
    );
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-tag">BUDGET · {isEdit ? 'EDIT' : 'NEW'} INCOME</div>
            <h3>{isEdit ? 'Edit income' : 'Add income'}</h3>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Description</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Salary"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div className="field">
            <label>Source · optional</label>
            <input
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="e.g. YouTube, employer, freelance"
            />
          </div>

          <div className="field-grid-2">
            <div className="field">
              <label>Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="mono"
              />
            </div>
            <div className="field">
              <label>{dayLabel}</label>
              <input
                type="number"
                min="1"
                max={maxDay}
                value={day}
                onChange={e => setDay(e.target.value)}
                className="mono"
              />
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={handleSave}
          >
            {isEdit ? 'Save changes' : 'Add income'}
          </button>
        </div>
      </div>
    </div>
  );
}
