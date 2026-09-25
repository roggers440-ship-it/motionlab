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

// Nepali prayer flags (lungta): blue, white, red, green, yellow — sky, air, fire, water, earth
const FLAG_COLORS = ['#1f5fd6', '#f4f1e8', '#d7263d', '#2e9d4f', '#f2c230'];
const FLAG_W = 4; // columns per flag (3 cells of cloth + a gap to the next flag)

function build(w: number, h: number) {
  const flags = 10;
  const cols = flags * FLAG_W, rows = 9;
  const gap = Math.min((w * 0.9) / cols, (h * 0.5) / rows);
  const ox = (w - gap * (cols - 1)) / 2, oy = h * 0.12;
  const pins = new Set([0, Math.round(cols / 3), Math.round((2 * cols) / 3), cols - 1]); // rope tied at 4 points → it sags between
  const pts: Pt[] = [];
  const links: Link[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x = ox + i * gap, y = oy + j * gap;
      pts.push({ x, y, px: x, py: y, pinned: j === 0 && pins.has(i) });
      const k = j * cols + i;
      // row 0 is the rope (fully linked); below it, don't link across the gap between two flags
      if (i > 0 && (j === 0 || i % FLAG_W !== 0)) links.push({ a: k - 1, b: k, rest: gap });
      if (j > 0) links.push({ a: k - cols, b: k, rest: gap });
    }
  return { pts, links, gap, cols, rows };
}

/** Draws each intact cell as a filled quad in its flag colour, then the rope on top. */
function drawFlags(ctx: CanvasRenderingContext2D, cl: ReturnType<typeof build>) {
  const alive = new Set(cl.links.map((l) => l.a * 100000 + l.b)); // links that haven't torn
  const has = (a: number, b: number) => alive.has(Math.min(a, b) * 100000 + Math.max(a, b));
  for (let j = 0; j < cl.rows - 1; j++)
    for (let i = 0; i < cl.cols - 1; i++) {
      if (i % FLAG_W === FLAG_W - 1) continue; // gap between flags
      const a = j * cl.cols + i, b = a + 1, c = a + cl.cols + 1, d = a + cl.cols;
      if (!has(a, b) || !has(a, d) || !has(b, c) || !has(d, c)) continue;
      const A = cl.pts[a], B = cl.pts[b], C = cl.pts[c], D = cl.pts[d];
      // fake lighting: cloth bunched up horizontally reads as a fold → darker
      const shade = Math.min(1, Math.max(0.45, (B.x - A.x) / cl.gap));
      ctx.globalAlpha = 0.55 + shade * 0.45;
      ctx.fillStyle = FLAG_COLORS[Math.floor(i / FLAG_W) % FLAG_COLORS.length];
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(C.x, C.y);
      ctx.lineTo(D.x, D.y);
      ctx.closePath();
      ctx.fill();
    }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#c9b89a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < cl.cols; i++) {
    const p = cl.pts[i];
    i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
  }
  ctx.stroke();
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
      drawFlags(ctx, cl);
    },
    { active: inView && visible && !reduced },
  );

  // reduced motion: draw one static frame
  useEffect(() => {
    if (!reduced || !cloth.current) return;
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFlags(ctx, cloth.current);
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
