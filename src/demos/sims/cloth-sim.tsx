'use client';
import { useEffect, useRef } from 'react';
import { useCanvas2D } from '@/hooks/useCanvas2D';
import { useInView, usePageVisible } from '@/hooks/useInView';
import { useRafLoop } from '@/hooks/useRafLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTier } from '@/hooks/useTier';
import { useControlRef } from '@/store/playground';

type Pt = { x: number; y: number; px: number; py: number; pinned: boolean };
type Link = { a: number; b: number; rest: number };

function build(w: number, h: number) {
  const cols = 44, rows = 26;
  const gap = Math.min((w * 0.8) / cols, (h * 0.75) / rows);
  const ox = (w - gap * (cols - 1)) / 2, oy = h * 0.08;
  const pts: Pt[] = [];
  const links: Link[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x = ox + i * gap, y = oy + j * gap;
      pts.push({ x, y, px: x, py: y, pinned: j === 0 && i % 4 === 0 });
      const k = j * cols + i;
      if (i > 0) links.push({ a: k - 1, b: k, rest: gap });
      if (j > 0) links.push({ a: k - cols, b: k, rest: gap });
    }
  return { pts, links, gap };
}

export default function ClothSim() {
  const { ref, w, h, dpr } = useCanvas2D();
  const inView = useInView(ref);
  const visible = usePageVisible();
  const reduced = useReducedMotion();
  const tier = useTier();
  const gravity = useControlRef('gravity', 900);
  const iterations = useControlRef('iterations', 4);
  const tear = useControlRef('tear', 60);
  const wind = useControlRef('wind', 0);
  const cloth = useRef<ReturnType<typeof build> | null>(null);
  const mouse = useRef({ x: 0, y: 0, px: 0, py: 0, down: false, cut: false, grabbed: -1 });
  const gust = useRef(0);
  const acc = useRef(0);

  useEffect(() => {
    if (w && h) cloth.current = build(w, h);
  }, [w, h]);

  useEffect(() => {
    const c = ref.current!;
    const pos = (e: PointerEvent) => {
      const b = c.getBoundingClientRect();
      const m = mouse.current;
      m.px = m.x; m.py = m.y;
      m.x = e.clientX - b.left; m.y = e.clientY - b.top;
    };
    const down = (e: PointerEvent) => {
      pos(e);
      const m = mouse.current;
      m.down = true;
      m.cut = e.button === 2 || e.shiftKey;
      // grab the nearest point
      let best = -1, bd = 40 * 40;
      cloth.current?.pts.forEach((p, i) => {
        const d = (p.x - m.x) ** 2 + (p.y - m.y) ** 2;
        if (d < bd) { bd = d; best = i; }
      });
      m.grabbed = m.cut ? -1 : best;
      c.setPointerCapture(e.pointerId);
    };
    const up = () => { mouse.current.down = false; mouse.current.grabbed = -1; };
    const menu = (e: Event) => e.preventDefault();
    c.addEventListener('pointermove', pos);
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointerup', up);
    c.addEventListener('contextmenu', menu);
    return () => {
      c.removeEventListener('pointermove', pos);
      c.removeEventListener('pointerdown', down);
      c.removeEventListener('pointerup', up);
      c.removeEventListener('contextmenu', menu);
    };
  }, [ref]);

  const STEP = tier === 'low' ? 1 / 30 : 1 / 60;
  const simulate = (dt: number, t: number) => {
    const cl = cloth.current;
    if (!cl) return;
    const m = mouse.current;
    const g = gravity.current;
    const windX = (wind.current + gust.current) * (0.6 + Math.sin(t * 1.7) * 0.4);
    gust.current *= 0.97;
    // Verlet integration
    for (const p of cl.pts) {
      if (p.pinned) continue;
      const vx = (p.x - p.px) * 0.99, vy = (p.y - p.py) * 0.99;
      p.px = p.x; p.py = p.y;
      p.x += vx + windX * dt * dt * (0.5 + Math.random() * 0.5);
      p.y += vy + g * dt * dt;
    }
    if (m.down && m.grabbed >= 0) {
      const p = cl.pts[m.grabbed];
      p.x = m.x; p.y = m.y;
    }
    // relax distance constraints; tear the over-stretched ones
    for (let k = 0; k < iterations.current; k++) {
      for (let i = cl.links.length - 1; i >= 0; i--) {
        const l = cl.links[i];
        const a = cl.pts[l.a], b = cl.pts[l.b];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.0001;
        if (d > tear.current + l.rest) { cl.links.splice(i, 1); continue; }
        const diff = ((d - l.rest) / d) * 0.5;
        const ox = dx * diff, oy = dy * diff;
        if (!a.pinned) { a.x += ox; a.y += oy; }
        if (!b.pinned) { b.x -= ox; b.y -= oy; }
      }
    }
    if (m.down && m.cut) {
      cl.links = cl.links.filter((l) => {
        const a = cl.pts[l.a], b = cl.pts[l.b];
        const mx = (a.x + b.x) / 2 - m.x, my = (a.y + b.y) / 2 - m.y;
        return mx * mx + my * my > 12 * 12;
      });
    }
  };

  useRafLoop(
    (dt, t) => {
      // fixed timestep with accumulator → identical behaviour at 30/60/120Hz
      acc.current += dt;
      while (acc.current >= STEP) {
        simulate(STEP, t);
        acc.current -= STEP;
      }
      const ctx = ref.current?.getContext('2d');
      const cl = cloth.current;
      if (!ctx || !cl) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(236,235,245,.55)';
      ctx.beginPath();
      for (const l of cl.links) {
        const a = cl.pts[l.a], b = cl.pts[l.b];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      ctx.fillStyle = '#ff6ec7';
      for (const p of cl.pts) if (p.pinned) ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
    },
    { active: inView && visible && !reduced },
  );

  // reduced motion: draw one static frame
  useEffect(() => {
    if (!reduced || !cloth.current) return;
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = 'rgba(236,235,245,.55)';
    ctx.beginPath();
    for (const l of cloth.current.links) {
      const a = cloth.current.pts[l.a], b = cloth.current.pts[l.b];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
  }, [reduced, w, h, dpr, ref]);

  return (
    <div className="relative h-full">
      <canvas ref={ref} className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing" aria-label="Cloth simulation. Drag to pull, shift-drag or right-drag to cut." />
      <div className="absolute left-6 top-6 z-10 flex flex-wrap items-center gap-2">
        <button className="btn" onClick={() => (cloth.current = build(w, h))}>Reset cloth</button>
        <button className="btn" onClick={() => (gust.current += 1500)}>Wind gust</button>
        <span className="eyebrow">drag to pull · shift/right-drag to cut · pull hard to tear</span>
      </div>
    </div>
  );
}
