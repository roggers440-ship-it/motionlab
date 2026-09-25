'use client';
import { useMemo } from 'react';
import { simulateSpring } from '@/lib/spring';

export function SpringGraph({ stiffness, damping, mass, velocity }: { stiffness: number; damping: number; mass: number; velocity: number }) {
  const { d, duration, overshoot, zeta } = useMemo(() => {
    const { samples, duration } = simulateSpring({ stiffness, damping, mass, velocity });
    const max = Math.max(1.05, ...samples);
    const min = Math.min(0, ...samples);
    const W = 280;
    const H = 90;
    const step = Math.max(1, Math.floor(samples.length / 140));
    let d = '';
    for (let i = 0; i < samples.length; i += step) {
      const x = (i / (samples.length - 1)) * W;
      const y = H - ((samples[i] - min) / (max - min)) * H;
      d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    const oneY = H - ((1 - min) / (max - min)) * H;
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));
    return { d: { path: d, oneY }, duration, overshoot: Math.max(0, (max - 1) * 100), zeta };
  }, [stiffness, damping, mass, velocity]);

  return (
    <figure className="space-y-1.5">
      <svg viewBox="0 0 280 90" className="h-[90px] w-full overflow-visible" role="img" aria-label={`Spring curve settling in ${duration.toFixed(2)} seconds`}>
        <line x1="0" x2="280" y1={d.oneY} y2={d.oneY} stroke="rgba(255,255,255,.15)" strokeDasharray="3 3" />
        <path d={d.path} fill="none" stroke="var(--cat)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <figcaption className="flex justify-between font-mono text-[10px] text-mute">
        <span>settle {duration.toFixed(2)}s</span>
        <span>overshoot {overshoot.toFixed(0)}%</span>
        <span title="Damping ratio ζ: <1 bouncy, 1 critical, >1 sluggish">ζ {zeta.toFixed(2)}</span>
      </figcaption>
    </figure>
  );
}
