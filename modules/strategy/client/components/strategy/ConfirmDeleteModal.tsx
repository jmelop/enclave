import { Modal, ModalHeader, ModalContent, ModalFooter, Button } from '@venator-ui/ui'

interface ConfirmDeleteModalProps {
  open: boolean
  itemName: string
  title?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({
  open,
  itemName,
  title = 'Delete item',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <Modal open={open} onClose={() => !loading && onCancel()} size="sm">
      <ModalHeader title={title} onClose={() => !loading && onCancel()} />
      <ModalContent>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.55 }}>
          Are you sure you want to delete <strong>{itemName}</strong>?{' '}
          This action cannot be undone.
        </p>
      </ModalContent>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting…' : 'Confirm'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
