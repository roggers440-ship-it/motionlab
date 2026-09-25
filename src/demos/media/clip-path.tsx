'use client';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useTweenControls } from '@/store/playground';

// Each pair has the same function + same number of points, so the browser can interpolate.
const SHAPES = [
  { name: 'Circle', hidden: 'circle(0% at 50% 50%)', shown: 'circle(75% at 50% 50%)', img: '/images/art-1.jpg' },
  { name: 'Diamond', hidden: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)', shown: 'polygon(50% -50%, 150% 50%, 50% 150%, -50% 50%)', img: '/images/art-2.jpg' },
  { name: 'Inset', hidden: 'inset(50% 50% 50% 50% round 40px)', shown: 'inset(0% 0% 0% 0% round 0px)', img: '/images/art-3.jpg' },
  { name: 'Wipe', hidden: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)', shown: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', img: '/images/art-4.jpg' },
  { name: 'Blinds', hidden: 'inset(0% 0% 100% 0%)', shown: 'inset(0% 0% 0% 0%)', img: '/images/art-5.jpg' },
  { name: 'Slash', hidden: 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)', shown: 'polygon(0% 0%, 130% 0%, 100% 100%, -30% 100%)', img: '/images/art-2.jpg' },
];

export default function ClipPath() {
  const [shown, setShown] = useState<boolean[]>(SHAPES.map(() => false));
  const { duration, bezier } = useTweenControls({ duration: 0.9 });
  const setAll = (v: boolean) => setShown(SHAPES.map(() => v));

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={() => setAll(true)}>Reveal all</button>
        <button className="btn" onClick={() => setAll(false)}>Hide all</button>
        <span className="eyebrow ml-auto self-center">hover or click a tile</span>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3">
        {SHAPES.map((s, i) => (
          <button key={s.name} aria-pressed={shown[i]} className="relative overflow-hidden rounded-2xl border border-line bg-ink-3 text-left"
            onPointerEnter={() => setShown((a) => a.map((v, k) => (k === i ? true : v)))}
            onClick={() => setShown((a) => a.map((v, k) => (k === i ? !v : v)))}>
            <span className="absolute left-4 top-4 font-display text-2xl font-semibold text-dim">{s.name}</span>
            <motion.img src={s.img} alt="" className="absolute inset-0 h-full w-full object-cover"
              initial={false} animate={{ clipPath: shown[i] ? s.shown : s.hidden }} transition={{ duration, ease: bezier }} />
            <motion.span className="absolute bottom-3 left-4 font-mono text-[10px] text-white" initial={false} animate={{ opacity: shown[i] ? 1 : 0 }}>
              {shown[i] ? s.shown : s.hidden}
            </motion.span>
          </button>
        ))}
      </div>
    </div>
  );
}
