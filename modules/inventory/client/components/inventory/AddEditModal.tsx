import { useEffect, useRef } from 'react'
import { Button, Input, Modal, ModalContent, ModalFooter, ModalHeader } from '@venator-ui/ui'
import { CATEGORIES } from '@/store/inventoryStore'
import { catBg, catBorder, catDot } from '@/lib/utils'
import type { CategoryId, ItemStatus } from '@/types/inventory'

export interface ItemDraft {
  id: string
  name: string
  category: CategoryId
  model: string
  qty: number | string
  status: ItemStatus
  location: string
  notes: string
}

export function blankDraft(): ItemDraft {
  return { id: '', name: '', category: 'elec', model: '', qty: 1, status: 'in', location: '', notes: '' }
}

const STATUS_OPTS: { value: ItemStatus; label: string; token: string }[] = [
  { value: 'in',  label: 'In Stock',     token: 'var(--success)' },
  { value: 'low', label: 'Low',          token: 'var(--warn)'    },
  { value: 'out', label: 'Out of Stock', token: 'var(--danger)'  },
]

interface AddEditModalProps {
  open: boolean
  draft: ItemDraft
  isEdit: boolean
  onChange: (draft: ItemDraft) => void
  onCancel: () => void
  onSave: () => void
}

export function AddEditModal({ open, draft, isEdit, onChange, onCancel, onSave }: AddEditModalProps) {
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && firstRef.current) firstRef.current.focus()
  }, [open])

  const set = <K extends keyof ItemDraft>(k: K, v: ItemDraft[K]) =>
    onChange({ ...draft, [k]: v })

  const valid = draft.name.trim().length > 0

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="xl"
      className="inventory-modal !border-[var(--border-default)] !rounded-[12px]"
      backdropClassName="inventory-modal-backdrop"
    >
      <ModalHeader
        title={isEdit ? 'Edit Item' : 'Add Item to Inventory'}
        onClose={onCancel}
        tag={isEdit ? 'EDIT' : 'NEW ENTRY'}
        description="Fill the fields below - all but Notes recommended"
        className="inventory-modal-header"
      />

      <ModalContent className="inventory-modal-content">
        <div className="modal-body">
          <div className="field f-full">
            <label>Name</label>
            <Input
              ref={firstRef}
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Arduino Uno Rev3"
            />
          </div>

          <div className="field f-full">
            <label>Category</label>
            <div className="cat-grid">
              {CATEGORIES.map((c) => {
                const sel = draft.category === c.id
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => set('category', c.id as CategoryId)}
                    className={`cat-chip ${sel ? 'sel' : ''}`}
                    style={sel ? { background: catBg(c.hue), borderColor: catBorder(c.hue) } : {}}
                  >
                    <span className="cat-dot" style={{ background: catDot(c.hue) }} />
                    <span>{c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="field">
            <label>Model / Reference</label>
            <Input
              className="mono"
              value={draft.model}
              onChange={(e) => set('model', e.target.value)}
              placeholder="ARD-UNO-R3"
            />
          </div>

          <div className="field">
            <label>Quantity</label>
            <div className="stepper">
              <Button
                type="button"
                variant="ghost"
                onClick={() => set('qty', Math.max(0, (Number(draft.qty) || 0) - 1))}
              >
                −
              </Button>
              <Input
                className="mono"
                type="number"
                value={draft.qty}
                onChange={(e) => set('qty', e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => set('qty', (Number(draft.qty) || 0) + 1)}
              >
                +
              </Button>
            </div>
          </div>

          <div className="field f-full">
            <label>Status</label>
            <div className="seg">
              {STATUS_OPTS.map((s) => {
                const sel = draft.status === s.value
                return (
                  <button
                    type="button"
                    key={s.value}
                    onClick={() => set('status', s.value)}
                    className={`seg-opt ${sel ? 'sel' : ''}`}
                    style={{ color: sel ? s.token : 'var(--fg-3)' }}
                  >
                    <span className="status-dot" style={{ background: s.token }} />
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="field f-full">
            <label>Location</label>
            <Input
              className="mono"
              value={draft.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Caja azul · cajón 2"
            />
          </div>

          <div className="field f-full">
            <label>Notes</label>
            <textarea
              rows={3}
              value={draft.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Optional · usage notes, specs, links…"
            />
          </div>
        </div>
      </ModalContent>

      <ModalFooter className="inventory-modal-footer">
        <div className="modal-hint mono">↵ to save · ESC to cancel</div>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="ghost" disabled={!valid} onClick={onSave}
          style={{ background: 'var(--enclave-amber)', color: '#000', borderColor: 'var(--enclave-amber)' }}>
          {isEdit ? 'Save changes' : 'Add item'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
