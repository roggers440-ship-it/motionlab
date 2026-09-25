'use client';
import { useEffect } from 'react';

/** Sets the page accent hue (CSS --hue) — each category has its own colour. */
export function HueSetter({ hue }: { hue: number }) {
  useEffect(() => {
    document.documentElement.style.setProperty('--hue', String(hue));
  }, [hue]);
  return null;
}
