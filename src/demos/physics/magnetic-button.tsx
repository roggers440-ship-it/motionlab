'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useRef } from 'react';
import { useControlRef, useSpringControls } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function Magnetic({ children, variant }: { children: React.ReactNode; variant: 'primary' | 'ghost' | 'round' }) {
  const ref = useRef<HTMLButtonElement>(null);
  const cfg = useSpringControls({ stiffness: 180, damping: 14, mass: 0.4 });
  const strength = useControlRef('strength', 0.4);
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, cfg);
  const y = useSpring(my, cfg);
  // the label moves further than the button → reads as depth
  const lx = useTransform(x, (v) => v * 0.5);
  const ly = useTransform(y, (v) => v * 0.5);

  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const b = ref.current!.getBoundingClientRect();
    mx.set((e.clientX - (b.left + b.width / 2)) * strength.current);
    my.set((e.clientY - (b.top + b.height / 2)) * strength.current);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };
  const cls = {
    primary: 'rounded-full bg-[var(--cat)] px-10 py-5 text-ink',
    ghost: 'rounded-full border border-white/25 px-10 py-5',
    round: 'size-32 rounded-full bg-white text-ink',
  }[variant];

  return (
    // generous invisible padding = the "magnetic field"
    <div className="p-10" onPointerMove={onMove} onPointerLeave={reset}>
      <motion.button ref={ref} style={{ x, y }} whileTap={{ scale: 0.94 }} className={`font-display text-lg font-semibold ${cls}`}>
        <motion.span style={{ x: lx, y: ly }} className="pointer-events-none inline-block">
          {children}
        </motion.span>
      </motion.button>
    </div>
  );
}

export default function MagneticButton() {
  return (
    <div className="flex h-full flex-wrap items-center justify-center gap-4 p-6">
      <Magnetic variant="primary">Get started</Magnetic>
      <Magnetic variant="ghost">Learn more</Magnetic>
      <Magnetic variant="round">Play ▶</Magnetic>
    </div>
  );
}
