import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders its children into the shared hero actions slot (next to the page
 * title in App.tsx), so each route can place its primary action up top —
 * matching the other modules. The slot lives outside <Routes>, so it persists
 * across tab switches; the active page simply portals its button in.
 */
export function HeroActions({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setSlot(document.getElementById('workout-hero-actions'));
  }, []);
  return slot ? createPortal(children, slot) : null;
}
