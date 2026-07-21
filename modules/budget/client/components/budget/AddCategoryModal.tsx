import { useState } from 'react';
import { X } from 'lucide-react';
import { CategoryGlyph, CATEGORY_ICONS } from '@/components/budget/CategoryGlyph';

const COLOR_SWATCHES = [
  '#f59e0b', '#f97316', '#ef4444', '#f43f5e', '#ec4899', '#a855f7',
  '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#14b8a6', '#10b981',
  '#22c55e', '#84cc16', '#eab308', '#6b7280',
];

interface Props {
  initial?: { name: string; color: string; icon: string; budget: number };
  onClose: () => void;
  onSave: (cat: { name: string; color: string; icon: string; budget: number }) => void;
  error?: string | null;
}

export function AddCategoryModal({ initial, onClose, onSave, error }: Props) {
  const isEdit = !!initial;

  const [name, setName]     = useState(initial?.name ?? '');
  const [color, setColor]   = useState(initial?.color ?? COLOR_SWATCHES[0]);
  const [icon, setIcon]     = useState(initial?.icon ?? 'package');
  const [budget, setBudget] = useState(initial ? String(initial.budget) : '');

  const valid = name.trim().length > 0;

  const handleSave = () => {
    if (!valid) return;
    onSave({ name: name.trim(), color, icon, budget: Math.max(0, parseInt(budget) || 0) });
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-tag">BUDGET · {isEdit ? 'EDIT' : 'NEW'} CATEGORY</div>
            <h3>{isEdit ? 'Edit category' : 'Add category'}</h3>
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
                placeholder="e.g. Pets"
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="field">
              <label>Monthly budget</label>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="0"
                className="mono"
              />
            </div>
          </div>

          <div className="field">
            <label>Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {COLOR_SWATCHES.map(c => (
                <button
                  key={c}
                  type="button"
                  aria-label={`color ${c}`}
                  onClick={() => setColor(c)}
                  style={{
                    width: 24, height: 24, borderRadius: 8, cursor: 'pointer',
                    background: c, padding: 0,
                    border: color === c ? '2px solid var(--fg)' : '2px solid transparent',
                    outline: color === c ? '1px solid var(--bg-3)' : 'none',
                    outlineOffset: -4,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="field">
            <label>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORY_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  aria-label={`icon ${ic}`}
                  onClick={() => setIcon(ic)}
                  style={{
                    cursor: 'pointer', padding: 2, background: 'none', borderRadius: 10,
                    border: icon === ic ? `1px solid ${color}` : '1px solid var(--border-subtle)',
                  }}
                >
                  <CategoryGlyph cat={{ icon: ic, color: icon === ic ? color : '#6b7280' }} size={30} />
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</div>}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} onClick={handleSave}>
            {isEdit ? 'Save changes' : 'Add category'}
          </button>
        </div>
      </div>
    </div>
  );
}
