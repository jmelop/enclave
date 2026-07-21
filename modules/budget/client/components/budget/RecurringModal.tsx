import { useState } from 'react';
import { X } from 'lucide-react';
import type { Category, CategoryId, RecurringBill } from '@/types/budget';

interface Props {
  initial?: RecurringBill;
  categories: Category[];
  onClose: () => void;
  onSave: (r: Omit<RecurringBill, 'id'> & { id?: string }) => void;
}

export function RecurringModal({ initial, categories, onClose, onSave }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [vendor, setVendor] = useState(initial?.vendor ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [cat, setCat] = useState<CategoryId>(initial?.cat ?? categories[0]?.id ?? 'other');
  const [day, setDay] = useState(initial ? String(initial.day) : '1');

  const valid = name.trim().length > 0 && Number(amount) > 0;

  const handleSave = () => {
    if (!valid) return;
    onSave({
      id: initial?.id,
      name: name.trim(),
      vendor: vendor.trim() || name.trim(),
      amount: Math.abs(parseFloat(amount)),
      cat,
      day: Math.min(31, Math.max(1, parseInt(day) || 1)),
    });
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-tag">BUDGET · {initial ? 'EDIT' : 'NEW'} RECURRING</div>
            <h3>{initial ? 'Edit recurring' : 'Add recurring'}</h3>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="field-grid-2">
            <div className="field">
              <label>Name</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Netflix"
              />
            </div>
            <div className="field">
              <label>Vendor</label>
              <input
                value={vendor}
                onChange={e => setVendor(e.target.value)}
                placeholder="Netflix Inc."
              />
            </div>
          </div>

          <div className="field-grid-2">
            <div className="field">
              <label>Monthly amount</label>
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
              <label>Bills on day</label>
              <input
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={e => setDay(e.target.value)}
                className="mono"
              />
            </div>
          </div>

          <div className="field">
            <label>Category</label>
            <div className="cat-picker">
              {categories.map(c => (
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
            {initial ? 'Save changes' : 'Add recurring'}
          </button>
        </div>
      </div>
    </div>
  );
}
