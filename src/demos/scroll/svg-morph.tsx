'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useControl } from '@/store/playground';
import { ScrollIntro, ScrollOutro, useScrollSettings } from '@/components/shell/ScrollBits';

// polygon helpers → path strings with different point counts on purpose
const poly = (n: number, r: number, inner?: number, rot = -Math.PI / 2) =>
  'M' + Array.from({ length: inner ? n * 2 : n }, (_, i) => {
    const rr = inner && i % 2 ? inner : r;
    const a = rot + (i / (inner ? n * 2 : n)) * Math.PI * 2;
    return `${(200 + Math.cos(a) * rr).toFixed(1)},${(200 + Math.sin(a) * rr).toFixed(1)}`;
  }).join(' L') + ' Z';

const SHAPES = [
  { id: 'circle', label: 'Circle', d: 'M200,40 A160,160 0 1,1 199.9,40 Z', color: '#ff6ec7' },
  { id: 'star', label: 'Star', d: poly(5, 170, 70), color: '#ffd479' },
  { id: 'blob', label: 'Blob', d: 'M200,52 C290,40 360,120 348,210 C338,300 262,362 184,350 C98,338 38,270 52,186 C64,104 120,62 200,52 Z', color: '#38e1c6' },
  { id: 'hex', label: 'Hexagon', d: poly(6, 165), color: '#7c5cff' },
  { id: 'burst', label: 'Burst', d: poly(12, 170, 120), color: '#ff8a5c' },
];

export default function SvgMorph() {
  const section = useRef<HTMLElement>(null);
  const { scrub, markers, reduced, deps } = useScrollSettings(1);
  const mapping = useControl('mapping', 'size') as 'size' | 'position' | 'complexity';

  useGSAP(
    () => {
      const q = gsap.utils.selector(section);
      const main = q('#morph-main')[0];
      if (reduced) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: section.current, start: 'top top', end: `+=${SHAPES.length * 70}%`, pin: true, scrub, markers } });
      SHAPES.slice(1).forEach((s, i) => {
        tl.to(main, { morphSVG: { shape: `#shape-${s.id}`, map: mapping, shapeIndex: 'auto' }, fill: s.color, duration: 1, ease: 'power2.inOut' }, i)
          .to(q('.label-track'), { yPercent: -((i + 1) * 100) / SHAPES.length, duration: 1, ease: 'power2.inOut' }, i)
          .to(main, { rotate: (i + 1) * 45, transformOrigin: '50% 50%', duration: 1, ease: 'power2.inOut' }, i);
      });
    },
    { scope: section, dependencies: [...deps, mapping], revertOnUpdate: true },
  );

  return (
    <>
      <ScrollIntro title="Shapes that become other shapes.">Different point counts, one path element. Change point mapping in the Playground.</ScrollIntro>
      <section ref={section} className="grid h-screen items-center gap-8 overflow-hidden px-4 md:grid-cols-2 md:px-16">
        <div className="h-[1.1em] overflow-hidden font-display text-6xl font-bold leading-[1.1] md:text-8xl">
          <div className="label-track">
            {SHAPES.map((s) => <div key={s.id} style={{ color: s.color }}>{s.label}</div>)}
          </div>
        </div>
        <svg viewBox="0 0 400 400" className="mx-auto w-full max-w-[520px]" aria-hidden>
          <defs>
            {SHAPES.map((s) => <path key={s.id} id={`shape-${s.id}`} d={s.d} />)}
          </defs>
          <path id="morph-main" d={SHAPES[0].d} fill={SHAPES[0].color} />
        </svg>
      </section>
      <ScrollOutro />
    </>
  );
}
