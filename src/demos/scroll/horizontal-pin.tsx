'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { ScrollIntro, ScrollOutro, useScrollSettings } from '@/components/shell/ScrollBits';

const PANELS = [
  { t: 'Pin', d: 'The section locks in place while you keep scrolling.', img: '/images/art-1.jpg' },
  { t: 'Translate', d: 'Vertical distance becomes horizontal movement of the track.', img: '/images/art-2.jpg' },
  { t: 'Nest', d: 'Each panel has its own triggers via containerAnimation.', img: '/images/art-3.jpg' },
  { t: 'Scrub', d: 'Tweak scrub smoothing and Lenis lerp in the Playground.', img: '/images/art-4.jpg' },
  { t: 'Release', d: 'At the end the pin releases and the page flows on.', img: '/images/art-5.jpg' },
];

export default function HorizontalPin() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const { scrub, markers, reduced, deps } = useScrollSettings(1);

  useGSAP(
    () => {
      const q = gsap.utils.selector(section);
      if (reduced) {
        // reduced: no pin, no horizontal travel — just gentle fades as panels arrive
        q('.panel').forEach((p) => gsap.from(p, { opacity: 0, duration: 0.6, scrollTrigger: { trigger: p, start: 'top 85%', markers } }));
        return;
      }
      const distance = () => track.current!.scrollWidth - window.innerWidth;
      const tween = gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub,
          markers,
          invalidateOnRefresh: true, // recompute distance on resize
          anticipatePin: 1,
        },
      });
      gsap.to(q('.progress'), { scaleX: 1, ease: 'none', scrollTrigger: { trigger: section.current, start: 'top top', end: () => `+=${distance()}`, scrub: true } });
      // nested: triggers based on each panel's HORIZONTAL position inside the moving track
      q('.panel').forEach((p) => {
        gsap.from(p.querySelector('.ptitle'), {
          yPercent: 100, rotate: 6, opacity: 0, ease: 'power3.out',
          scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 75%', end: 'left 35%', scrub: true, markers },
        });
        gsap.fromTo(p.querySelector('img'), { scale: 1.35, xPercent: -8 }, {
          scale: 1, xPercent: 8, ease: 'none',
          scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        });
      });
    },
    { scope: section, dependencies: deps, revertOnUpdate: true },
  );

  return (
    <>
      <ScrollIntro title="Vertical scroll, horizontal story.">Five panels, one pinned section, nested triggers.</ScrollIntro>
      <section ref={section} className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 z-10 h-1 bg-white/10">
          <div className="progress h-full origin-left scale-x-0 bg-[var(--cat)]" />
        </div>
        <div ref={track} className={reduced ? 'flex flex-col gap-6 px-4 md:px-8' : 'flex h-screen w-max items-center gap-8 px-[8vw]'}>
          {PANELS.map((p, i) => (
            <article key={p.t} className="panel relative flex h-[70vh] w-[min(80vw,900px)] shrink-0 flex-col justify-end overflow-hidden rounded-3xl ring-1 ring-white/10">
              <img src={p.img} alt="" className="absolute inset-0 h-full w-full object-cover will-change-transform" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="relative p-8 md:p-12">
                <p className="eyebrow !text-white/70">0{i + 1} / 0{PANELS.length}</p>
                <div className="overflow-hidden">
                  <h3 className="ptitle font-display text-6xl font-bold text-white md:text-8xl">{p.t}</h3>
                </div>
                <p className="mt-3 max-w-md text-white/80">{p.d}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <ScrollOutro />
    </>
  );
}
