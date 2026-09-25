'use client';
import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import { ScrollIntro, ScrollOutro, useScrollSettings } from '@/components/shell/ScrollBits';

export default function HighlightFill() {
  const root = useRef<HTMLDivElement>(null);
  const { scrub, markers, reduced, deps } = useScrollSettings(0.5);

  useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(root);
      q('.para').forEach((p) => {
        const split = SplitText.create(p, { type: 'words' });
        gsap.fromTo(split.words, { opacity: 0.12 }, {
          opacity: 1, stagger: 0.1, ease: 'none',
          scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub, markers },
        });
      });
      q('mark').forEach((m) => {
        gsap.to(m, { backgroundSize: '100% 100%', ease: 'none', scrollTrigger: { trigger: m, start: 'top 70%', end: 'top 45%', scrub: true } });
      });
    },
    { scope: root, dependencies: deps, revertOnUpdate: true },
  );

  const mark = 'bg-[linear-gradient(transparent_60%,oklch(0.75_0.17_var(--hue)/.55)_60%)] bg-no-repeat [background-size:0%_100%] text-inherit';
  return (
    <div ref={root}>
      <ScrollIntro title="Read along." />
      <div className="mx-auto max-w-4xl space-y-[18vh] px-4 pb-[10vh] font-display text-3xl font-medium leading-snug md:text-5xl md:px-8">
        <p className="para">
          Great motion is <mark className={reduced ? '' : mark}>invisible</mark>. It explains where things came from, where they went and what
          just changed — then gets out of the way.
        </p>
        <p className="para">
          Animate <mark className={reduced ? '' : mark}>transform and opacity</mark>, measure before you guess, and always leave a door open for people who
          prefer less motion.
        </p>
        <p className="para">
          The best compliment an animation can get is <mark className={reduced ? '' : mark}>“it just feels right.”</mark>
        </p>
      </div>
      <ScrollOutro />
    </div>
  );
}
