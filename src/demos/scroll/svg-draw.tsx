'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { ScrollIntro, ScrollOutro, useScrollSettings } from '@/components/shell/ScrollBits';

const ROUTE = 'M60,520 C160,380 260,560 360,420 S520,160 640,260 S820,520 940,380 S1080,120 1180,200 S1320,420 1380,300';
const STOPS = [
  { t: 0.0, label: 'Kathmandu' },
  { t: 0.27, label: 'Pokhara' },
  { t: 0.52, label: 'Jomsom' },
  { t: 0.78, label: 'Muktinath' },
  { t: 1.0, label: 'Base camp' },
];

export default function SvgDraw() {
  const section = useRef<HTMLElement>(null);
  const path = useRef<SVGPathElement>(null);
  const dot = useRef<SVGGElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const { scrub, markers, reduced, deps } = useScrollSettings(0.6);

  useGSAP(
    () => {
      const q = gsap.utils.selector(section);
      const p = path.current!;
      const len = p.getTotalLength();
      const place = (progress: number) => {
        const pt = p.getPointAtLength(len * progress);
        dot.current?.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
        if (pct.current) pct.current.textContent = `${Math.round(progress * 100)}%`;
      };
      if (reduced) {
        place(1);
        gsap.set(q('.stop'), { scale: 1, opacity: 1 });
        return;
      }
      gsap.set(q('.stop'), { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section.current, start: 'top top', end: '+=250%', pin: true, scrub, markers },
        defaults: { ease: 'none' },
      });
      tl.fromTo(p, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1, onUpdate() { place(this.progress()); } }, 0);
      tl.fromTo(q('.ghost'), { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 1 }, 0);
      // waypoints pop exactly when the line reaches them
      STOPS.forEach((s, i) => tl.to(q(`.stop-${i}`), { scale: 1, opacity: 1, duration: 0.05, ease: 'back.out(3)' }, Math.max(0, s.t - 0.03)));
      tl.to(q('.bar'), { scaleX: 1, duration: 1 }, 0);
    },
    { scope: section, dependencies: deps, revertOnUpdate: true },
  );

  return (
    <>
      <ScrollIntro title="Trace the route.">DrawSVG animates the stroke; getPointAtLength keeps the traveller on the line.</ScrollIntro>
      <section ref={section} className="relative flex h-screen flex-col justify-center overflow-hidden px-4 md:px-8">
        <div className="mx-auto mb-6 flex w-full max-w-[1400px] items-center gap-4">
          <span ref={pct} className="w-16 font-display text-3xl font-semibold tabular-nums">0%</span>
          <div className="h-1 flex-1 rounded-full bg-white/10"><div className="bar h-full origin-left scale-x-0 rounded-full bg-[var(--cat)]" /></div>
        </div>
        <svg viewBox="0 0 1440 640" className="mx-auto w-full max-w-[1400px]" role="img">
          <title>A trekking route drawn progressively across five stops</title>
          <path className="ghost" d={ROUTE} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
          <path ref={path} d={ROUTE} fill="none" stroke="var(--cat)" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {STOPS.map((s, i) => {
            const probe = typeof document !== 'undefined' ? document.createElementNS('http://www.w3.org/2000/svg', 'path') : null;
            probe?.setAttribute('d', ROUTE);
            const pt = probe ? probe.getPointAtLength(probe.getTotalLength() * s.t) : { x: 0, y: 0 };
            return (
              <g key={s.label} className={`stop stop-${i}`} transform={`translate(${pt.x} ${pt.y})`}>
                <circle r="14" fill="var(--color-ink)" stroke="var(--cat)" strokeWidth="3" />
                <circle r="5" fill="var(--cat)" />
                <text y="-26" textAnchor="middle" fill="white" fontSize="22" fontFamily="var(--font-display)" fontWeight="600">{s.label}</text>
              </g>
            );
          })}
          <g ref={dot}>
            <circle r="18" fill="var(--cat)" opacity=".25" />
            <circle r="9" fill="#fff" />
          </g>
        </svg>
      </section>
      <ScrollOutro />
    </>
  );
}
