'use client';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useControl, useSpringControls } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function TiltCard({ img, title }: { img: string; title: string }) {
  const cfg = useSpringControls({ stiffness: 150, damping: 18, mass: 0.6 });
  const max = useControl('max', 14);
  const reduced = useReducedMotion();
  // normalised pointer position 0..1 inside the card
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, cfg);
  const sy = useSpring(py, cfg);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const gx = useTransform(sx, (v) => `${v * 100}%`);
  const gy = useTransform(sy, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,.35), transparent 55%)`;

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        onPointerMove={(e) => {
          if (reduced) return;
          const b = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - b.left) / b.width);
          py.set((e.clientY - b.top) / b.height);
        }}
        onPointerLeave={() => {
          px.set(0.5);
          py.set(0.5);
        }}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative h-[340px] w-[250px] rounded-3xl shadow-2xl ring-1 ring-white/15"
      >
        <img src={img} alt="" className="absolute inset-0 h-full w-full rounded-3xl object-cover" />
        <motion.div className="pointer-events-none absolute inset-0 rounded-3xl mix-blend-overlay" style={{ background: glare }} />
        {/* translateZ pops the label off the card surface */}
        <div className="absolute inset-x-5 bottom-5" style={{ transform: 'translateZ(50px)' }}>
          <p className="eyebrow !text-white/70">Collectible</p>
          <p className="font-display text-2xl font-semibold text-white drop-shadow">{title}</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function Tilt() {
  return (
    <div className="flex h-full flex-wrap items-center justify-center gap-10 p-6">
      <TiltCard img="/images/art-1.jpg" title="Aurora" />
      <TiltCard img="/images/art-3.jpg" title="Ember" />
      <TiltCard img="/images/art-2.jpg" title="Tidal" />
    </div>
  );
}
