'use client';
import { useRef, useState } from 'react';
import { CustomEase, gsap, Observer, SplitText, useGSAP } from '@/lib/gsap';
import { useTweenControls } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const SLIDES = [
  { t: 'Wheel', d: 'One notch = one slide, no matter how hard you scroll.', img: '/images/art-1.jpg' },
  { t: 'Touch', d: 'Swipe up or down — same gesture, normalised.', img: '/images/art-2.jpg' },
  { t: 'Pointer', d: 'Drag with a mouse or pen.', img: '/images/art-3.jpg' },
  { t: 'Keys', d: 'Arrow keys and buttons work too.', img: '/images/art-4.jpg' },
];

export default function ObserverSlides() {
  const root = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const { duration, bezier } = useTweenControls({ duration: 1.1 });
  const reduced = useReducedMotion();
  const api = useRef<{ goto: (i: number, dir: number) => void }>({ goto: () => {} });

  useGSAP(
    (_, contextSafe) => {
      const q = gsap.utils.selector(root);
      const slides = q('.slide');
      const outer = q('.outer');
      const inner = q('.inner');
      const splits = q('.stitle').map((el) => SplitText.create(el, { type: 'chars,words', mask: 'chars' }));
      const ease = CustomEase.create('slides', `M0,0 C${bezier[0]},${bezier[1]} ${bezier[2]},${bezier[3]} 1,1`);
      let current = 0;
      let animating = false;
      gsap.set(outer, { yPercent: 100 });
      gsap.set(inner, { yPercent: -100 });
      gsap.set([outer[0], inner[0]], { yPercent: 0 });
      gsap.set(slides[0], { autoAlpha: 1, zIndex: 1 });

      const goto = contextSafe!((i: number, dir: number) => {
        i = gsap.utils.wrap(0, slides.length, i);
        if (animating || i === current) return;
        animating = true;
        const d = dir >= 0 ? 1 : -1;
        const tl = gsap.timeline({ defaults: { duration: reduced ? 0.01 : duration, ease }, onComplete: () => { animating = false; } });
        gsap.set(slides[i], { autoAlpha: 1, zIndex: 2 });
        gsap.set(slides[current], { zIndex: 1 });
        // two-layer wipe: outer and inner move in opposite directions → the image stays still while the mask moves
        tl.fromTo([outer[i], inner[i]], { yPercent: (k: number) => (k ? -100 * d : 100 * d) }, { yPercent: 0 }, 0)
          .fromTo(slides[i].querySelector('img'), { scale: 1.25 }, { scale: 1 }, 0)
          .from(splits[i].chars, { yPercent: 110 * d, stagger: 0.02, duration: reduced ? 0.01 : duration * 0.8, ease: 'power3.out' }, reduced ? 0 : duration * 0.25)
          .set(slides[current], { autoAlpha: 0 });
        current = i;
        setIndex(i);
      }) as (i: number, dir: number) => void;
      api.current.goto = (i, dir) => goto(i, dir);

      Observer.create({
        target: root.current,
        type: 'wheel,touch,pointer',
        wheelSpeed: -1,
        tolerance: 10,
        preventDefault: true,
        onDown: () => goto(current - 1, -1),
        onUp: () => goto(current + 1, 1),
      });
    },
    { scope: root, dependencies: [duration, ...bezier, reduced], revertOnUpdate: true },
  );

  return (
    <div ref={root} className="relative h-full touch-none select-none overflow-hidden" data-lenis-prevent tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') api.current.goto(index + 1, 1);
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') api.current.goto(index - 1, -1);
      }}
      aria-roledescription="carousel" aria-label="Fullscreen slides — scroll, swipe or use arrow keys">
      {SLIDES.map((s, i) => (
        <section key={s.t} className="slide invisible absolute inset-0" aria-hidden={i !== index}>
          <div className="outer h-full w-full overflow-hidden">
            <div className="inner h-full w-full overflow-hidden">
              <div className="relative h-full w-full">
                <img src={s.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="stitle font-display text-[14vmin] font-bold leading-none text-white">{s.t}</h3>
                  <p className="mt-4 max-w-md text-lg text-white/85">{s.d}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3" aria-live="polite">
        <button className="btn !bg-black/40 !text-white" onClick={() => api.current.goto(index - 1, -1)} aria-label="Previous slide">↑</button>
        <span className="font-mono text-sm text-white">{index + 1} / {SLIDES.length}</span>
        <button className="btn !bg-black/40 !text-white" onClick={() => api.current.goto(index + 1, 1)} aria-label="Next slide">↓</button>
      </div>
    </div>
  );
}
