'use client';
import { animate, motion, useMotionValue } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useControl, useSpringControls } from '@/store/playground';

const CARDS = [
  { label: 'Spring', hue: 320, x: -260, y: -80, r: -8 },
  { label: 'Inertia', hue: 265, x: -80, y: 60, r: 4 },
  { label: 'Elastic', hue: 200, x: 120, y: -100, r: 10 },
  { label: 'Momentum', hue: 35, x: 260, y: 70, r: -5 },
  { label: 'Bounds', hue: 160, x: 20, y: -10, r: 2 },
];

function Card({ c, table, z, onFront, scale }: { c: (typeof CARDS)[number]; table: React.RefObject<HTMLDivElement | null>; z: number; onFront: () => void; scale: number }) {
  const spring = useSpringControls({ stiffness: 260, damping: 20, mass: 1 });
  const elastic = useControl('elastic', 0.35);
  const power = useControl('power', 0.4);
  // initial layout scales with the table so cards start on-screen on phones too
  const x = useMotionValue(c.x * scale);
  const y = useMotionValue(c.y * scale);

  // keyboard path: arrow keys nudge the card with the same spring
  const onKey = (e: React.KeyboardEvent) => {
    const d = e.shiftKey ? 80 : 30;
    const map: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
    const m = map[e.key];
    if (!m) return;
    e.preventDefault();
    onFront();
    animate(x, x.get() + m[0], spring);
    animate(y, y.get() + m[1], spring);
  };

  return (
    <motion.button
      drag
      dragConstraints={table}
      dragElastic={elastic}
      dragTransition={{ power, timeConstant: 280, bounceStiffness: spring.stiffness, bounceDamping: spring.damping }}
      onPointerDown={onFront}
      onKeyDown={onKey}
      whileDrag={{ scale: 1.08, rotate: 0, boxShadow: '0 30px 60px -10px rgba(0,0,0,.6)' }}
      whileHover={{ scale: 1.03 }}
      initial={{ rotate: c.r, opacity: 0, scale: 0.8 }}
      animate={{ rotate: c.r, opacity: 1, scale: 1 }}
      transition={spring}
      style={{ x, y, zIndex: z, background: `linear-gradient(145deg, oklch(0.62 0.19 ${c.hue}), oklch(0.38 0.14 ${c.hue + 30}))` }}
      aria-label={`${c.label} card. Drag, or use arrow keys to move.`}
      className="absolute left-1/2 top-1/2 -ml-[80px] -mt-[100px] flex h-[200px] w-[160px] cursor-grab touch-none select-none flex-col justify-between rounded-2xl p-4 text-left shadow-2xl ring-1 ring-white/20 active:cursor-grabbing"
    >
      <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">drag · throw</span>
      <span className="font-display text-2xl font-semibold text-white">{c.label}</span>
    </motion.button>
  );
}

export default function DragThrow() {
  const table = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState(CARDS.map((_, i) => i));
  const [scale, setScale] = useState<number | null>(null);
  useLayoutEffect(() => setScale(Math.min(1, (table.current?.clientWidth ?? 800) / 760)), []);
  const front = (i: number) => setOrder((o) => [...o.filter((k) => k !== i), i]);

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <p className="eyebrow mb-3">Throw a card at the wall — release velocity becomes inertia, the edge becomes a spring.</p>
      <div ref={table} className="relative flex-1 overflow-hidden rounded-2xl border border-dashed border-white/15 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:22px_22px]">
        {scale !== null &&
          CARDS.map((c, i) => <Card key={c.label} c={c} table={table} z={order.indexOf(i) + 1} onFront={() => front(i)} scale={scale} />)}
      </div>
    </div>
  );
}
