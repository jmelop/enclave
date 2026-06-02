import { useState } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES } from '@/lib/seed';
import type { CategoryId, MonthData } from '@/types/budget';

interface Props {
  month: MonthData;
  onClose: () => void;
  onSave: (name: string, amount: number, cat: CategoryId, day: number) => void;
}

export function AddExpenseModal({ month, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState<CategoryId>('food');
  const [day, setDay] = useState(String(month.asOfDay));

  const valid = name.trim().length > 0 && Number(amount) > 0;

  const handleSave = () => {
    if (!valid) return;
    onSave(
      name.trim(),
      Math.abs(parseFloat(amount)),
      cat,
      Math.min(month.asOfDay, Math.max(1, parseInt(day) || 1)),
    );
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-tag">BUDGET · NEW EXPENSE</div>
            <h3>Add expense</h3>
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
              placeholder="e.g. Groceries at Whole Foods"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
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
              <label>Day (1 – {month.asOfDay})</label>
              <input
                type="number"
                min="1"
                max={month.asOfDay}
                value={day}
                onChange={e => setDay(e.target.value)}
                className="mono"
              />
            </div>
          </div>

          <div className="field">
            <label>Category</label>
            <div className="cat-picker">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`cat-pick-btn ${cat === c.id ? 'sel' : ''}`}
                  style={cat === c.id ? { borderColor: c.color, background: c.color + '18' } : undefined}
                  onClick={() => setCat(c.id)}
                >
                  <span className="cat-pick-dot" style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
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
            Add expense
          </button>
        </div>
      </div>
    </div>
  );
}
