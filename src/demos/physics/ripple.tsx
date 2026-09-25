'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTweenControls } from '@/store/playground';

type R = { id: number; x: number; y: number; size: number };
let n = 0;

function RippleSurface({ className, children, color = 'rgba(255,255,255,.35)' }: { className: string; children: React.ReactNode; color?: string }) {
  const [ripples, setRipples] = useState<R[]>([]);
  const { duration, bezier } = useTweenControls({ duration: 0.65 });

  const spawn = (el: HTMLElement, cx?: number, cy?: number) => {
    const b = el.getBoundingClientRect();
    const x = cx === undefined ? b.width / 2 : cx - b.left;
    const y = cy === undefined ? b.height / 2 : cy - b.top;
    // radius = distance to the farthest corner, so the ripple always covers the surface
    const size = 2 * Math.hypot(Math.max(x, b.width - x), Math.max(y, b.height - y));
    setRipples((r) => [...r, { id: ++n, x, y, size }]);
  };

  return (
    <button
      className={`relative overflow-hidden ${className}`}
      onPointerDown={(e) => spawn(e.currentTarget, e.clientX, e.clientY)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !e.repeat && spawn(e.currentTarget)}
    >
      <span className="relative z-10">{children}</span>
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span key={r.id} aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{ left: r.x - r.size / 2, top: r.y - r.size / 2, width: r.size, height: r.size, background: color }}
            initial={{ scale: 0, opacity: 1 }} animate={{ scale: 1, opacity: 0 }}
            transition={{ duration, ease: bezier, opacity: { duration: duration * 1.2, ease: 'easeOut' } }}
            onAnimationComplete={() => setRipples((rs) => rs.filter((x) => x.id !== r.id))} />
        ))}
      </AnimatePresence>
    </button>
  );
}

export default function Ripple() {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="grid w-full max-w-3xl gap-5 md:grid-cols-3">
        <RippleSurface className="rounded-full bg-[var(--cat)] px-8 py-4 font-semibold text-ink" color="rgba(255,255,255,.55)">Primary</RippleSurface>
        <RippleSurface className="rounded-full border border-white/25 px-8 py-4 font-semibold">Outline</RippleSurface>
        <RippleSurface className="rounded-full bg-white px-8 py-4 font-semibold text-ink" color="rgba(124,92,255,.35)">Light</RippleSurface>
        <RippleSurface className="h-48 rounded-3xl bg-ink-3 p-6 text-left md:col-span-3" color="oklch(0.75 0.17 var(--hue) / .25)">
          <span className="block font-display text-2xl">Large surface</span>
          <span className="text-sm text-dim">The ripple grows from exactly where you pressed. Keyboard presses ripple from the centre.</span>
        </RippleSurface>
      </div>
    </div>
  );
}
