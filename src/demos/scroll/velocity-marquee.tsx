'use client';
import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { useControl, useControlRef } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ScrollIntro, ScrollOutro } from '@/components/shell/ScrollBits';

const ROWS = [
  ['Motion', 'GSAP', 'Lenis', 'Three.js', 'Rive', 'Lottie', 'GLSL'],
  ['Spring', 'Scrub', 'Pin', 'Morph', 'Flip', 'Stagger', 'Ease'],
  ['60fps', 'Transform', 'Opacity', 'Compositor', 'GPU', 'Budget'],
];

export default function VelocityMarquee() {
  const root = useRef<HTMLDivElement>(null);
  const speed = useControl('speed', 20);
  const boost = useControlRef('boost', 4);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tweens = q('.row-inner').map((el, i) =>
        // content is duplicated once → moving by -50% loops seamlessly
        gsap.fromTo(el, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: speed * (1 + i * 0.25), ease: 'none', repeat: -1 }),
      );
      if (reduced || paused) {
        tweens.forEach((t) => t.pause());
        return;
      }
      let dir = 1;
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate(self) {
          if (self.direction !== dir) dir = self.direction;
          const v = Math.abs(self.getVelocity()) / 1000;
          tweens.forEach((t) => {
            t.timeScale(dir * (1 + v * boost.current));
            // then glide back to base speed (keeping the new direction)
            gsap.to(t, { timeScale: dir, duration: 1.2, ease: 'power2.out', overwrite: true });
          });
        },
      });
    },
    { scope: root, dependencies: [speed, reduced, paused], revertOnUpdate: true },
  );

  return (
    <div ref={root}>
      <ScrollIntro title="Scroll speed is the throttle.">Scroll down: rows speed up. Scroll up: they reverse.</ScrollIntro>
      <div className="mx-auto mb-6 flex max-w-[1400px] px-4 md:px-8">
        <button className="btn" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>{paused ? '▶ Play' : '❚❚ Pause'} marquee</button>
      </div>
      <div className="space-y-4 py-[15vh]" aria-label={ROWS.flat().join(', ')}>
        {ROWS.map((row, i) => (
          <div key={i} className={`overflow-hidden border-y border-line py-3 ${i === 1 ? '-rotate-2 bg-[var(--cat)] text-ink' : ''}`} aria-hidden>
            <div className="row-inner flex w-max will-change-transform">
              {[...row, ...row, ...row, ...row].map((w, k) => (
                <span key={k} className="flex items-center whitespace-nowrap px-6 font-display text-6xl font-bold md:text-8xl">
                  {w}
                  <span className="ml-12 text-3xl opacity-50">✦</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="h-[80vh]" />
      <ScrollOutro />
    </div>
  );
}
