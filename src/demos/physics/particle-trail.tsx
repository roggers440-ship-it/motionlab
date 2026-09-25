'use client';
import { useEffect, useRef } from 'react';
import { useCanvas2D } from '@/hooks/useCanvas2D';
import { useInView, usePageVisible } from '@/hooks/useInView';
import { useRafLoop } from '@/hooks/useRafLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useControlRef } from '@/store/playground';

const MAX = 1500;

export default function ParticleTrail() {
  const { ref, w, h, dpr } = useCanvas2D();
  const inView = useInView(ref);
  const visible = usePageVisible();
  const reduced = useReducedMotion();
  const rate = useControlRef('rate', 4);
  const life = useControlRef('life', 1.1);
  const gravity = useControlRef('gravity', 120);
  const size = useControlRef('size', 5);

  // Structure-of-arrays pool: zero allocations while running.
  const pool = useRef({
    x: new Float32Array(MAX), y: new Float32Array(MAX), vx: new Float32Array(MAX), vy: new Float32Array(MAX),
    age: new Float32Array(MAX).fill(Infinity), hue: new Float32Array(MAX), next: 0,
  });
  const pointer = useRef({ x: -100, y: -100, px: -100, py: -100 });

  useEffect(() => {
    const c = ref.current!;
    const on = (e: PointerEvent) => {
      const b = c.getBoundingClientRect();
      const p = pointer.current;
      p.x = e.clientX - b.left;
      p.y = e.clientY - b.top;
      if (reduced) return;
      const P = pool.current;
      const n = rate.current;
      for (let k = 0; k < n; k++) {
        const i = P.next;
        P.next = (P.next + 1) % MAX;
        const t = k / n; // interpolate between last and current pointer → no gaps when moving fast
        P.x[i] = p.px + (p.x - p.px) * t;
        P.y[i] = p.py + (p.y - p.py) * t;
        const a = Math.random() * Math.PI * 2;
        const s = 20 + Math.random() * 90;
        P.vx[i] = Math.cos(a) * s + (p.x - p.px) * 2;
        P.vy[i] = Math.sin(a) * s + (p.y - p.py) * 2;
        P.age[i] = 0;
        P.hue[i] = (performance.now() / 20 + Math.random() * 40) % 360;
      }
      p.px = p.x;
      p.py = p.y;
    };
    c.addEventListener('pointermove', on);
    return () => c.removeEventListener('pointermove', on);
  }, [ref, reduced, rate]);

  useRafLoop(
    (dt) => {
      const ctx = ref.current?.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const P = pool.current;
      const L = life.current;
      const g = gravity.current;
      const S = size.current;
      for (let i = 0; i < MAX; i++) {
        if (P.age[i] >= L) continue;
        P.age[i] += dt;
        P.vx[i] *= 0.97;
        P.vy[i] = P.vy[i] * 0.97 + g * dt;
        P.x[i] += P.vx[i] * dt;
        P.y[i] += P.vy[i] * dt;
        const k = 1 - P.age[i] / L;
        ctx.fillStyle = `hsla(${P.hue[i]}, 90%, 65%, ${k})`;
        ctx.beginPath();
        ctx.arc(P.x[i], P.y[i], S * k + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      const p = pointer.current;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    },
    { active: inView && visible },
  );

  return (
    <div className="relative h-full">
      <canvas ref={ref} className="absolute inset-0 h-full w-full cursor-none touch-none" aria-label="Particle trail canvas — move your pointer" />
      <p className="pointer-events-none absolute left-6 top-6 eyebrow">Move the pointer · pool of {MAX} recycled particles</p>
    </div>
  );
}
