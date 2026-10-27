import { useEffect } from 'react'

// venator's Modal stacks its full-screen centering wrapper above the backdrop,
// so the backdrop's onClick never fires — close on any press outside the dialog instead.
export function useDismissOnOutsideClick(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const handler = (e: PointerEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest('[role="dialog"]')) onClose()
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open, onClose])
}
