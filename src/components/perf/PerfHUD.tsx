'use client';
// Live performance HUD. Deliberately React-free in its hot path: one rAF loop
// measures frames, and the DOM is written through refs 4× per second.
import { useEffect, useRef, useState } from 'react';
import { useUI, selectTier } from '@/store/ui';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { glStats } from '@/lib/perf';
import { cn } from '@/lib/cn';

const BUDGET = 1000 / 60;
const N = 90;

export function PerfHUD() {
  const hud = useUI((s) => s.hud);
  const tier = useUI(selectTier);
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(true);
  // compact by default on phones so the HUD never covers the demo
  useEffect(() => {
    if (window.innerWidth < 768) setOpen(false);
  }, []);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const msRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLDivElement>(null);
  const extraRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!hud) return;
    const times = new Float32Array(N);
    let head = 0;
    let frames = 0;
    let last = performance.now();
    let windowStart = last;
    let worst = 0;
    let longTasks = 0;
    let raf = 0;

    let po: PerformanceObserver | undefined;
    try {
      po = new PerformanceObserver((l) => (longTasks += l.getEntries().length));
      po.observe({ type: 'longtask', buffered: false });
    } catch {
      /* Safari/Firefox: no longtask */
    }

    const draw = () => {
      const c = sparkRef.current;
      const ctx = c?.getContext('2d');
      if (!c || !ctx) return;
      const { width: w, height: h } = c;
      ctx.clearRect(0, 0, w, h);
      // budget line
      const yb = h - (BUDGET / 50) * h;
      ctx.strokeStyle = 'rgba(255,255,255,.18)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, yb);
      ctx.lineTo(w, yb);
      ctx.stroke();
      ctx.setLineDash([]);
      const bw = w / N;
      for (let i = 0; i < N; i++) {
        const v = times[(head + i) % N];
        const bh = Math.min(h, (v / 50) * h);
        ctx.fillStyle = v > 33 ? '#ff5a6a' : v > BUDGET + 1.5 ? '#ffd479' : '#38e1c6';
        ctx.fillRect(i * bw, h - bh, Math.max(1, bw - 1), bh);
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = now - last;
      last = now;
      times[head] = dt;
      head = (head + 1) % N;
      worst = Math.max(worst, dt);
      frames++;
      if (now - windowStart >= 250) {
        const fps = (frames * 1000) / (now - windowStart);
        if (fpsRef.current) fpsRef.current.textContent = String(Math.round(fps));
        if (msRef.current) msRef.current.textContent = `${(1000 / fps).toFixed(1)}ms · worst ${worst.toFixed(0)}ms`;
        if (barRef.current) {
          const pct = Math.min(1, 1000 / fps / (BUDGET * 2));
          barRef.current.style.transform = `scaleX(${pct})`;
          barRef.current.style.background = fps >= 55 ? '#38e1c6' : fps >= 40 ? '#ffd479' : '#ff5a6a';
        }
        if (glRef.current) {
          glRef.current.style.display = glStats.active && now - glStats.lastUpdate < 1000 ? '' : 'none';
          glRef.current.textContent = `draw ${glStats.calls} · tris ${fmt(glStats.triangles)} · pts ${fmt(glStats.points)} · tex ${glStats.textures} · geo ${glStats.geometries}`;
        }
        if (extraRef.current) {
          const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
          extraRef.current.textContent = `long tasks ${longTasks}${mem ? ` · heap ${(mem.usedJSHeapSize / 1048576).toFixed(0)}MB` : ''}`;
        }
        draw();
        frames = 0;
        worst = 0;
        windowStart = now;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      po?.disconnect();
    };
  }, [hud]);

  if (!hud) return null;
  return (
    <aside aria-label="Performance monitor" className={cn('glass fixed bottom-3 left-3 z-50 rounded-xl p-2.5 font-mono text-[10.5px] text-dim shadow-xl', open ? 'w-[250px]' : 'w-auto')}>
      <button className="flex w-full items-center gap-2 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span ref={fpsRef} className="min-w-[2ch] font-display text-xl font-semibold tabular-nums text-fg">--</span>
        <span className="text-mute">FPS</span>
        <span className="ml-auto flex gap-1">
          <span className="chip !px-1.5 !py-0 !text-[9px] uppercase">{tier}</span>
          {reduced && <span className="chip !px-1.5 !py-0 !text-[9px]">RM</span>}
        </span>
      </button>
      <div className={cn('space-y-1.5 pt-1.5', !open && 'hidden')}>
        <span ref={msRef} className="block tabular-nums">-- ms</span>
        <div className="h-1 overflow-hidden rounded-full bg-white/10" title="Frame time vs. 16.7ms budget (bar half = on budget)">
          <div ref={barRef} className="h-full origin-left rounded-full" style={{ transform: 'scaleX(0)' }} />
        </div>
        <canvas ref={sparkRef} width={460} height={60} className="h-[30px] w-full" aria-hidden />
        <div ref={glRef} className="tabular-nums text-acc-3" style={{ display: 'none' }} />
        <div ref={extraRef} className="tabular-nums" />
      </div>
    </aside>
  );
}

const fmt = (n: number) => (n > 9999 ? `${(n / 1000).toFixed(0)}k` : String(n));
