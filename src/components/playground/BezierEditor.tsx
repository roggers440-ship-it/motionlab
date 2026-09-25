'use client';
import { useRef } from 'react';
import { usePlayground } from '@/store/playground';

const S = 160;
const PAD = 40; // room for y overshoot (-1..2 range visible partially)

export function BezierEditor() {
  const v = usePlayground((s) => s.values);
  const setMany = usePlayground((s) => s.setMany);
  const svg = useRef<SVGSVGElement>(null);
  const [x1, y1, x2, y2] = [v.x1, v.y1, v.x2, v.y2].map(Number);
  const toPx = (x: number, y: number) => [x * S, S - y * S] as const;
  const [p1x, p1y] = toPx(x1, y1);
  const [p2x, p2y] = toPx(x2, y2);

  const drag = (which: 1 | 2) => (e: React.PointerEvent) => {
    const el = svg.current;
    if (!el) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const scale = (S + PAD * 2) / r.width;
      const x = Math.min(1, Math.max(0, ((ev.clientX - r.left) * scale - PAD) / S));
      const y = Math.min(2, Math.max(-1, (S - ((ev.clientY - r.top) * scale - PAD)) / S));
      const round = (n: number) => Math.round(n * 100) / 100;
      setMany(which === 1 ? { x1: round(x), y1: round(y) } : { x2: round(x), y2: round(y) });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <svg ref={svg} viewBox={`${-PAD} ${-PAD} ${S + PAD * 2} ${S + PAD * 2}`} className="mx-auto w-full max-w-[220px] touch-none select-none" role="img"
      aria-label={`Cubic bezier ${x1}, ${y1}, ${x2}, ${y2}. Use the sliders below for precise values.`}>
      <rect x="0" y="0" width={S} height={S} fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.1)" />
      <line x1="0" y1={S} x2={p1x} y2={p1y} stroke="rgba(255,255,255,.35)" />
      <line x1={S} y1="0" x2={p2x} y2={p2y} stroke="rgba(255,255,255,.35)" />
      <path d={`M0,${S} C${p1x},${p1y} ${p2x},${p2y} ${S},0`} fill="none" stroke="var(--cat)" strokeWidth="3" />
      {[
        [p1x, p1y, 1],
        [p2x, p2y, 2],
      ].map(([x, y, w]) => (
        <circle key={w} cx={x} cy={y} r="8" fill="#fff" stroke="var(--cat)" strokeWidth="3" className="cursor-grab active:cursor-grabbing" onPointerDown={drag(w as 1 | 2)} />
      ))}
    </svg>
  );
}
