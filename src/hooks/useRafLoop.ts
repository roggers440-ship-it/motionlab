'use client';
import { useEffect, useRef } from 'react';

type Opts = { active?: boolean; fps?: number };

/**
 * rAF loop with delta time (seconds), clamped to avoid spiral-of-death after
 * a tab switch. `fps` throttles via an accumulator (e.g. 30 on low tier).
 * The callback is read from a ref, so it can change without restarting the loop.
 */
export function useRafLoop(cb: (dt: number, t: number) => void, { active = true, fps }: Opts = {}) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const step = fps ? 1 / fps : 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      if (!step) return cbRef.current(dt, now / 1000);
      acc += dt;
      if (acc >= step) {
        cbRef.current(acc, now / 1000);
        acc = 0;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, fps]);
}
