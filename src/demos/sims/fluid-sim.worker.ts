/// <reference lib="webworker" />
// Runs the solver + rendering entirely off the main thread.
import { createFluid, hueToRgb, type FluidParams } from './fluid-sim.solver';

type Msg =
  | { type: 'init'; canvas: OffscreenCanvas; width: number; height: number }
  | { type: 'resize'; width: number; height: number }
  | { type: 'pointer'; x: number; y: number; dx: number; dy: number }
  | { type: 'params'; params: Partial<FluidParams> }
  | { type: 'paused'; paused: boolean };

const fluid = createFluid(128);
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let canvas: OffscreenCanvas | null = null;
const small = new OffscreenCanvas(fluid.N, fluid.N);
const sctx = small.getContext('2d')!;
const img = sctx.createImageData(fluid.N, fluid.N);
let paused = false;
let last = performance.now();
let hue = 0;
let idle = 0;

const raf: (cb: (t: number) => void) => void =
  (self as unknown as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame?.bind(self) ?? ((cb) => setTimeout(() => cb(performance.now()), 16));

function frame(now: number) {
  raf(frame);
  if (!ctx || !canvas || paused) return;
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  // ambient swirls until the user interacts
  idle += dt;
  if (idle > 1.2) {
    const t = now / 1000;
    fluid.splat(0.5 + Math.cos(t) * 0.3, 0.5 + Math.sin(t * 1.3) * 0.3, Math.cos(t * 2) * 0.4, Math.sin(t * 2) * 0.4, hueToRgb((t * 0.1) % 1));
  }
  fluid.step(dt);
  fluid.paint(img.data);
  sctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
}

self.onmessage = (e: MessageEvent<Msg>) => {
  const m = e.data;
  if (m.type === 'init') {
    canvas = m.canvas;
    canvas.width = m.width;
    canvas.height = m.height;
    ctx = canvas.getContext('2d');
    raf(frame);
  } else if (m.type === 'resize' && canvas) {
    canvas.width = m.width;
    canvas.height = m.height;
  } else if (m.type === 'pointer') {
    idle = 0;
    hue = (hue + 0.012) % 1;
    fluid.splat(m.x, m.y, m.dx, m.dy, hueToRgb(hue));
  } else if (m.type === 'params') {
    Object.assign(fluid.params, m.params);
  } else if (m.type === 'paused') {
    paused = m.paused;
    if (!paused) last = performance.now();
  }
};
