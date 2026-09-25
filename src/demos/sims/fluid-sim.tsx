'use client';
import { useEffect, useRef, useState } from 'react';
import { usePlayground } from '@/store/playground';
import { useInView, usePageVisible } from '@/hooks/useInView';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { createFluid, hueToRgb } from './fluid-sim.solver';

type Port = { post: (msg: Record<string, unknown>, transfer?: Transferable[]) => void; dispose: () => void };

/** Same message protocol whether the solver runs in a Worker or (fallback) on the main thread. */
function mainThreadPort(canvas: HTMLCanvasElement): Port {
  const fluid = createFluid(96); // smaller grid on the main thread
  const ctx = canvas.getContext('2d')!;
  const small = document.createElement('canvas');
  small.width = small.height = fluid.N;
  const sctx = small.getContext('2d')!;
  const img = sctx.createImageData(fluid.N, fluid.N);
  let paused = false;
  let raf = 0;
  let last = performance.now();
  let hue = 0;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (paused) return;
    fluid.step(Math.min(0.033, (now - last) / 1000));
    last = now;
    fluid.paint(img.data);
    sctx.putImageData(img, 0, 0);
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
  };
  raf = requestAnimationFrame(loop);
  return {
    post: (m: Record<string, unknown>) => {
      if (m.type === 'pointer') fluid.splat(m.x as number, m.y as number, m.dx as number, m.dy as number, hueToRgb((hue = (hue + 0.012) % 1)));
      if (m.type === 'params') Object.assign(fluid.params, m.params);
      if (m.type === 'paused') paused = m.paused as boolean;
      if (m.type === 'resize') {
        canvas.width = m.width as number;
        canvas.height = m.height as number;
      }
    },
    dispose: () => cancelAnimationFrame(raf),
  };
}

export default function FluidSim() {
  const host = useRef<HTMLDivElement>(null);
  const port = useRef<Port | null>(null);
  const [mode, setMode] = useState<'worker' | 'main' | '…'>('…');
  const values = usePlayground((s) => s.values);
  const inView = useInView(host);
  const visible = usePageVisible();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = host.current!;
    // A fresh <canvas> per effect run: transferControlToOffscreen() can only be
    // called once per element, and Strict Mode runs effects twice in dev.
    const canvas = document.createElement('canvas');
    canvas.className = 'absolute inset-0 h-full w-full touch-none';
    el.prepend(canvas);
    const size = () => ({ width: Math.round(el.clientWidth * Math.min(devicePixelRatio, 1.5)), height: Math.round(el.clientHeight * Math.min(devicePixelRatio, 1.5)) });

    if ('transferControlToOffscreen' in canvas && typeof Worker !== 'undefined') {
      const worker = new Worker(new URL('./fluid-sim.worker.ts', import.meta.url), { type: 'module' });
      const off = canvas.transferControlToOffscreen();
      worker.postMessage({ type: 'init', canvas: off, ...size() }, [off]);
      port.current = { post: (m, t) => worker.postMessage(m, t ?? []), dispose: () => worker.terminate() };
      setMode('worker');
    } else {
      Object.assign(canvas, size());
      port.current = mainThreadPort(canvas);
      setMode('main');
    }

    let px = 0, py = 0, has = false;
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width;
      const y = (e.clientY - b.top) / b.height;
      if (has) port.current?.post({ type: 'pointer', x, y, dx: (x - px) * 60, dy: (y - py) * 60 });
      px = x; py = y; has = true;
    };
    const ro = new ResizeObserver(() => port.current?.post({ type: 'resize', ...size() }));
    ro.observe(el);
    el.addEventListener('pointermove', onMove);
    return () => {
      el.removeEventListener('pointermove', onMove);
      ro.disconnect();
      port.current?.dispose();
      port.current = null;
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    port.current?.post({ type: 'params', params: { viscosity: values.viscosity, dissipation: values.dissipation, force: values.force, radius: values.radius } });
  }, [values, mode]);

  useEffect(() => {
    // pause offscreen / hidden tab; reduced motion lets a few frames render, then freezes
    const run = inView && visible;
    port.current?.post({ type: 'paused', paused: !run });
    if (run && reduced) {
      const t = setTimeout(() => port.current?.post({ type: 'paused', paused: true }), 800);
      return () => clearTimeout(t);
    }
  }, [inView, visible, reduced, mode]);

  return (
    <div ref={host} className="relative h-full overflow-hidden bg-[#07070b]">
      <div className="pointer-events-none absolute left-6 top-6 z-10 space-y-2">
        <span className="chip !border-[var(--cat)] !text-fg">solver: {mode === 'worker' ? 'Web Worker + OffscreenCanvas' : mode === 'main' ? 'main thread (fallback)' : '…'}</span>
        <p className="eyebrow">Stir with your pointer · the main thread only posts messages</p>
      </div>
    </div>
  );
}
