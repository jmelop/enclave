import { useEffect, useRef, useState } from 'react'
import { Input, Modal, ModalContent, ModalFooter, ModalHeader } from '@venator-ui/ui'
import { catBg, catBorder, catDot, catFg, DEFAULT_LOW_THRESHOLD } from '@/lib/utils'
import { useDismissOnOutsideClick } from '@/lib/useDismissOnOutsideClick'
import type { Category, CategoryInput } from '@/types/inventory'

const HUE_SWATCHES = [0, 25, 50, 80, 120, 160, 190, 220, 260, 300, 330, 350]

interface CategoryModalProps {
  open: boolean
  initial?: Category          // present = edit mode
  error?: string | null
  onClose: () => void
  onSave: (input: CategoryInput) => void
}

export function CategoryModal({ open, initial, error, onClose, onSave }: CategoryModalProps) {
  const isEdit = !!initial
  const firstRef = useRef<HTMLInputElement>(null)
  useDismissOnOutsideClick(open, onClose)

  const [label, setLabel] = useState('')
  const [short, setShort] = useState('')
  const [hue, setHue]     = useState(HUE_SWATCHES[0])
  const [lowThreshold, setLowThreshold] = useState<number | string>(DEFAULT_LOW_THRESHOLD)

  useEffect(() => {
    if (!open) return
    setLabel(initial?.label ?? '')
    setShort(initial?.short ?? '')
    setHue(initial?.hue ?? HUE_SWATCHES[0])
    setLowThreshold(initial?.lowThreshold ?? DEFAULT_LOW_THRESHOLD)
    firstRef.current?.focus()
  }, [open, initial])

  const valid = label.trim().length > 0
  const threshold = Math.max(0, Math.floor(Number(lowThreshold) || 0))
  // Mirrors the server default: first word of the label, uppercased.
  const shortFallback = (label.trim().split(/\s+/)[0] || 'SHORT').toUpperCase().slice(0, 8)

  const handleSave = () => {
    if (!valid) return
    onSave({ label: label.trim(), short: short.trim(), hue, lowThreshold: threshold })
  }

  const badgeStyle = { background: catBg(hue), color: catFg(hue), borderColor: catBorder(hue) }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      className="inventory-modal !rounded-[12px]"
      backdropClassName="inventory-modal-backdrop"
    >
      <ModalHeader
        title={isEdit ? 'Edit category' : 'Add category'}
        onClose={onClose}
        tag={isEdit ? 'EDIT CATEGORY' : 'NEW CATEGORY'}
        description="Items keep their category when you rename or recolor it"
        className="inventory-modal-header"
      />

      <ModalContent className="inventory-modal-content">
        <div className="modal-body">
          <div className="field">
            <label>Name</label>
            <Input
              ref={firstRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Filament"
            />
          </div>

          <div className="field">
            <label>Short label</label>
            <Input
              className="mono"
              value={short}
              maxLength={8}
              onChange={(e) => setShort(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={shortFallback}
            />
          </div>

          <div className="field f-full">
            <label>Low stock at</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="stepper" style={{ width: 150 }}>
                <button type="button" onClick={() => setLowThreshold(Math.max(0, threshold - 1))}>−</button>
                <input
                  className="mono"
                  type="number"
                  min={0}
                  value={lowThreshold}
                  onChange={(e) => setLowThreshold(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <button type="button" onClick={() => setLowThreshold(threshold + 1)}>+</button>
              </div>
              <span className="inv-field-hint mono">
                {threshold === 0
                  ? 'Never low · only out when empty'
                  : `Items with ${threshold === 1 ? '1 unit' : `1–${threshold} units`} show as low`}
              </span>
            </div>
          </div>

          <div className="field f-full">
            <label>Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              {HUE_SWATCHES.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-label={`hue ${h}`}
                  onClick={() => setHue(h)}
                  style={{
                    width: 24, height: 24, borderRadius: 8, cursor: 'pointer', padding: 0,
                    background: catDot(h),
                    border: hue === h ? '2px solid var(--fg)' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="field f-full">
            <label>Preview</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="cat-badge" style={badgeStyle}>
                <span className="cat-dot" style={{ background: catDot(hue) }} />
                {label.trim() || 'Category'}
              </span>
              <span className="cat-badge" style={badgeStyle}>
                <span className="cat-dot" style={{ background: catDot(hue) }} />
                {short.trim().toUpperCase() || shortFallback}
              </span>
            </div>
          </div>

          {error && <div style={{ gridColumn: '1 / -1', color: 'var(--danger)', fontSize: 12 }}>{error}</div>}
        </div>
      </ModalContent>

      <ModalFooter className="inventory-modal-footer">
        <div className="modal-hint mono">↵ to save · ESC to cancel</div>
        <button type="button" className="inv-btn inv-btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="inv-btn inv-btn-primary" disabled={!valid} onClick={handleSave}>
          {isEdit ? 'Save changes' : 'Add category'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
