'use client';
// Shared helpers for scroll-layout demos.
import { useControl } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/** Playground-driven ScrollTrigger settings + the effective reduced-motion flag. */
export function useScrollSettings(defaultScrub = 1) {
  const scrubN = useControl('scrub', defaultScrub);
  const markers = useControl('markers', false);
  const reduced = useReducedMotion();
  // GSAP: scrub:true = locked to scroll, scrub:n = n seconds of catch-up smoothing
  const scrub: true | number = scrubN === 0 ? true : scrubN;
  return { scrub, markers, reduced, deps: [scrubN, markers, reduced] as unknown[] };
}

export function ScrollIntro({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto flex min-h-[55vh] max-w-[1400px] flex-col justify-center px-4 md:px-8">
      <p className="eyebrow mb-4">Scroll to play ↓</p>
      <h2 className="max-w-4xl font-display text-4xl font-semibold leading-tight md:text-6xl">{title}</h2>
      {children && <div className="mt-4 max-w-2xl text-dim">{children}</div>}
    </section>
  );
}

export function ScrollOutro({ text = 'End of timeline.' }: { text?: string }) {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-[1400px] items-center justify-center px-4 md:px-8">
      <p className="eyebrow">{text} Scroll back up to reverse ↑</p>
    </section>
  );
}
