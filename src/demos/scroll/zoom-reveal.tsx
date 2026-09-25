'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { ScrollIntro, ScrollOutro, useScrollSettings } from '@/components/shell/ScrollBits';

export default function ZoomReveal() {
  const section = useRef<HTMLElement>(null);
  const { scrub, markers, reduced, deps } = useScrollSettings(1);

  useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(section);
      gsap.timeline({ scrollTrigger: { trigger: section.current, start: 'top top', end: '+=180%', pin: true, scrub, markers }, defaults: { ease: 'power2.inOut' } })
        .fromTo(q('.frame'), { clipPath: 'inset(32% 36% 32% 36% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, 0)
        .fromTo(q('.frame img'), { scale: 1.6 }, { scale: 1 }, 0)
        .to(q('.left'), { xPercent: -120, opacity: 0 }, 0)
        .to(q('.right'), { xPercent: 120, opacity: 0 }, 0)
        .from(q('.caption'), { y: 60, opacity: 0, duration: 0.3 }, 0.7);
    },
    { scope: section, dependencies: deps, revertOnUpdate: true },
  );

  return (
    <>
      <ScrollIntro title="From thumbnail to full-bleed." />
      <section ref={section} className="relative grid h-screen place-items-center overflow-hidden">
        <div className="frame absolute inset-0" style={{ clipPath: reduced ? 'inset(8% 8% 8% 8% round 28px)' : undefined }}>
          <img src="/images/art-3.jpg" alt="Abstract ember-coloured artwork" className="h-full w-full object-cover will-change-transform" />
          <div className="caption absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-10 md:p-16">
            <p className="font-display text-4xl font-semibold text-white md:text-6xl">clip-path + scale, one timeline.</p>
          </div>
        </div>
        <div className="pointer-events-none relative z-10 flex w-full justify-between px-6 font-display text-[11vw] font-bold leading-none md:px-12">
          <span className="left">Zoom</span>
          <span className="right text-[var(--cat)]">In</span>
        </div>
      </section>
      <ScrollOutro />
    </>
  );
}
