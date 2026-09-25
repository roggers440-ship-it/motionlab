'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { ScrollIntro, ScrollOutro, useScrollSettings } from '@/components/shell/ScrollBits';

const CARDS = [
  { t: 'Research', d: 'Understand the motion vocabulary of the product before designing a single curve.', hue: 320 },
  { t: 'Prototype', d: 'Tune springs live. Export exactly what you tuned — no translation loss.', hue: 265 },
  { t: 'Measure', d: 'Frame budget: 16.7ms. The HUD shows what each demo actually costs.', hue: 200 },
  { t: 'Ship', d: 'Reduced-motion path, offscreen pausing, tiered quality. Then ship.', hue: 160 },
];

export default function StackingCards() {
  const root = useRef<HTMLDivElement>(null);
  const { scrub, markers, reduced, deps } = useScrollSettings(0);

  useGSAP(
    () => {
      if (reduced) return;
      const cards = gsap.utils.toArray<HTMLElement>('.stack-card', root.current);
      // position: sticky does the stacking — GSAP only shrinks the card being covered
      cards.slice(0, -1).forEach((card, i) => {
        gsap.to(card, {
          scale: 0.9 - (cards.length - i) * 0.015,
          filter: 'brightness(0.55)',
          ease: 'none',
          scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 15%', scrub, markers },
        });
      });
    },
    { scope: root, dependencies: deps, revertOnUpdate: true },
  );

  return (
    <div ref={root}>
      <ScrollIntro title="Cards that stack as you read." />
      <div className="mx-auto max-w-4xl space-y-[10vh] px-4 pb-[40vh] md:px-8">
        {CARDS.map((c, i) => (
          <article key={c.t} className="stack-card sticky flex h-[60vh] origin-top flex-col justify-between rounded-[32px] p-8 shadow-2xl ring-1 ring-white/10 md:p-12"
            style={{ top: `calc(15vh + ${i * 18}px)`, background: `linear-gradient(145deg, oklch(0.45 0.16 ${c.hue}), oklch(0.2 0.08 ${c.hue + 30}))` }}>
            <span className="font-mono text-sm text-white/60">0{i + 1}</span>
            <div>
              <h3 className="font-display text-5xl font-bold text-white md:text-7xl">{c.t}</h3>
              <p className="mt-3 max-w-lg text-lg text-white/75">{c.d}</p>
            </div>
          </article>
        ))}
      </div>
      <ScrollOutro />
    </div>
  );
}
