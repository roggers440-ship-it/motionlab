'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useCanvas2D } from '@/hooks/useCanvas2D';
import { useInView, usePageVisible } from '@/hooks/useInView';
import { useRafLoop } from '@/hooks/useRafLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useControl, useControlRef } from '@/store/playground';

// Compact 3D value noise (x, y, time) — smooth enough for a flow field.
function makeNoise(seed = 1) {
  const p = new Uint8Array(512);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647; // Park–Miller LCG → deterministic shuffle
    const j = seed % (i + 1);
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const h = (i: number, j: number, k: number) => p[p[p[i & 255] + (j & 255)] + (k & 255)] / 255;
  return (x: number, y: number, z: number) => {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    const u = fade(x - X), v = fade(y - Y), w = fade(z - Z);
    return lerp(
      lerp(lerp(h(X, Y, Z), h(X + 1, Y, Z), u), lerp(h(X, Y + 1, Z), h(X + 1, Y + 1, Z), u), v),
      lerp(lerp(h(X, Y, Z + 1), h(X + 1, Y, Z + 1), u), lerp(h(X, Y + 1, Z + 1), h(X + 1, Y + 1, Z + 1), u), v),
      w,
    );
  };
}

export default function FlowField() {
  const { ref, w, h, dpr } = useCanvas2D();
  const inView = useInView(ref);
  const visible = usePageVisible();
  const reduced = useReducedMotion();
  const count = useControl('count', 3000);
  const scale = useControlRef('scale', 0.003);
  const speed = useControlRef('speed', 1.2);
  const fade = useControlRef('fade', 0.06);
  const noise = useMemo(() => makeNoise(7), []);
  const P = useRef({ x: new Float32Array(0), y: new Float32Array(0), life: new Float32Array(0) });
  const z = useRef(0);

  // (re)seed particles when count or size changes — typed arrays, no objects
  useEffect(() => {
    if (!w || !h) return;
    const x = new Float32Array(count), y = new Float32Array(count), life = new Float32Array(count);
    for (let i = 0; i < count; i++) { x[i] = Math.random() * w; y[i] = Math.random() * h; life[i] = Math.random() * 200; }
    P.current = { x, y, life };
    const ctx = ref.current?.getContext('2d');
    if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#07070b'; ctx.fillRect(0, 0, w * dpr, h * dpr); }
  }, [count, w, h, dpr, ref]);

  const frame = (dt: number) => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(7,7,11,${fade.current})`; // trail fade
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    z.current += dt * 0.15;
    const { x, y, life } = P.current;
    const sc = scale.current, sp = speed.current * 60 * dt;
    // 3 colour buckets → 3 paths per frame instead of thousands of strokes
    const buckets = ['rgba(255,110,199,.35)', 'rgba(124,92,255,.35)', 'rgba(56,225,198,.35)'];
    for (let b = 0; b < 3; b++) {
      ctx.strokeStyle = buckets[b];
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = b; i < x.length; i += 3) {
        const a = noise(x[i] * sc, y[i] * sc, z.current) * Math.PI * 4;
        const nx = x[i] + Math.cos(a) * sp, ny = y[i] + Math.sin(a) * sp;
        ctx.moveTo(x[i], y[i]);
        ctx.lineTo(nx, ny);
        x[i] = nx; y[i] = ny;
        if (--life[i] < 0 || nx < 0 || ny < 0 || nx > w || ny > h) { x[i] = Math.random() * w; y[i] = Math.random() * h; life[i] = 100 + Math.random() * 200; }
      }
      ctx.stroke();
    }
  };

  useRafLoop(frame, { active: inView && visible && !reduced });
  useEffect(() => {
    if (reduced) for (let k = 0; k < 120; k++) frame(1 / 60); // one pre-baked still
  }, [reduced, w, h]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative h-full bg-[#07070b]">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-label="Generative flow field" />
      <p className="eyebrow pointer-events-none absolute left-6 top-6">{count.toLocaleString()} particles · 3 paths per frame</p>
    </div>
  );
}
