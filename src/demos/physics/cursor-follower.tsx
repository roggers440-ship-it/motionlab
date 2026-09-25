'use client';
import { motion, useMotionValue, useSpring, useTransform, useVelocity } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useControlRef, useSpringControls } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function CursorFollower() {
  const area = useRef<HTMLDivElement>(null);
  const cfg = useSpringControls({ stiffness: 350, damping: 28, mass: 0.5 });
  const stretch = useControlRef('stretch', 0.5);
  const reduced = useReducedMotion();
  const [trap, setTrap] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const w = useMotionValue(28);
  const h = useMotionValue(28);
  const x = useSpring(mx, cfg);
  const y = useSpring(my, cfg);
  const sw = useSpring(w, { stiffness: 400, damping: 30 });
  const sh = useSpring(h, { stiffness: 400, damping: 30 });
  const radius = useSpring(useMotionValue(999), { stiffness: 400, damping: 30 });

  // velocity → squash & stretch in the direction of travel
  const vx = useVelocity(x);
  const vy = useVelocity(y);
  const speed = useTransform(() => Math.min(1, Math.hypot(vx.get(), vy.get()) / 2500));
  const scaleX = useTransform(() => (trap || reduced ? 1 : 1 + speed.get() * stretch.current * 1.2));
  const scaleY = useTransform(() => (trap || reduced ? 1 : 1 - speed.get() * stretch.current * 0.5));
  const rotate = useTransform(() => (Math.atan2(vy.get(), vx.get()) * 180) / Math.PI);

  useEffect(() => {
    const el = area.current!;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const b = el.getBoundingClientRect();
      setVisible(true);
      if (trap) {
        // magnetic trap: sit on the target, but lean 15% toward the pointer
        mx.set(trap.left - b.left + trap.width / 2 + (e.clientX - (trap.left + trap.width / 2)) * 0.15);
        my.set(trap.top - b.top + trap.height / 2 + (e.clientY - (trap.top + trap.height / 2)) * 0.15);
      } else {
        mx.set(e.clientX - b.left);
        my.set(e.clientY - b.top);
      }
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, [trap, mx, my]);

  const enter = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTrap(r);
    w.set(r.width + 16);
    h.set(r.height + 12);
    radius.set(16);
  };
  const leave = () => {
    setTrap(null);
    w.set(28);
    h.set(28);
    radius.set(999);
  };

  return (
    <div ref={area} onPointerLeave={() => setVisible(false)} className="relative flex h-full flex-col items-center justify-center gap-10 overflow-hidden p-8">
      <motion.div aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 border-2 border-[var(--cat)] mix-blend-difference [@media(pointer:coarse)]:hidden"
        style={{ x, y, width: sw, height: sh, translateX: '-50%', translateY: '-50%', borderRadius: radius, rotate: trap ? 0 : rotate, scaleX, scaleY, opacity: visible ? 1 : 0, background: trap ? 'oklch(0.75 0.17 var(--hue) / .15)' : 'var(--cat)' }} />
      <h2 className="max-w-2xl text-center font-display text-4xl font-semibold md:text-6xl">Move fast. Watch the blob stretch.</h2>
      <div className="flex flex-wrap justify-center gap-4">
        {['Hover trap', 'Another one', 'Snap here'].map((l) => (
          <button key={l} onPointerEnter={enter} onPointerLeave={leave} className="rounded-2xl px-6 py-3 font-medium text-fg">
            {l}
          </button>
        ))}
      </div>
      <p className="text-sm text-mute">Mouse only — hidden on touch. The native cursor stays visible for accessibility.</p>
    </div>
  );
}
