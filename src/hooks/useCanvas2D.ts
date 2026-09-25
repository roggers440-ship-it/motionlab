'use client';
import { useEffect, useRef, useState } from 'react';
import { useTier } from './useTier';

/**
 * Sizes a <canvas> to its CSS box × a tier-capped DPR and keeps it in sync
 * with ResizeObserver. Returns the canvas ref plus the current pixel size.
 */
export function useCanvas2D() {
  const ref = useRef<HTMLCanvasElement>(null);
  const tier = useTier();
  const [size, setSize] = useState({ w: 0, h: 0, dpr: 1 });
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const cap = tier === 'high' ? 2 : tier === 'mid' ? 1.5 : 1;
    const ro = new ResizeObserver(([e]) => {
      const dpr = Math.min(window.devicePixelRatio || 1, cap);
      const w = Math.max(1, Math.round(e.contentRect.width));
      const h = Math.max(1, Math.round(e.contentRect.height));
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      setSize({ w, h, dpr });
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [tier]);
  return { ref, ...size };
}
