'use client';
import { useEffect, useRef, useState } from 'react';
import type { AnimationItem } from 'lottie-web';
import { gsap, useGSAP } from '@/lib/gsap';
import { useControl } from '@/store/playground';
import { ScrollIntro, ScrollOutro, useScrollSettings } from '@/components/shell/ScrollBits';

export default function LottieScroll() {
  const section = useRef<HTMLElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [anim, setAnim] = useState<AnimationItem | null>(null);
  const renderer = useControl('renderer', 'svg') as 'svg' | 'canvas';
  const frameLabel = useRef<HTMLSpanElement>(null);
  const { scrub, markers, reduced, deps } = useScrollSettings(0.8);

  // (re)load when the renderer changes; lottie-web itself is lazy-imported
  useEffect(() => {
    let a: AnimationItem | undefined;
    let alive = true;
    import('lottie-web').then(({ default: lottie }) => {
      if (!alive || !box.current) return;
      a = lottie.loadAnimation({ container: box.current, renderer, loop: false, autoplay: false, path: '/lottie/orbit.json' });
      a.addEventListener('DOMLoaded', () => alive && setAnim(a!));
    });
    return () => {
      alive = false;
      a?.destroy();
      setAnim(null);
    };
  }, [renderer]);

  useGSAP(
    () => {
      if (!anim) return;
      const last = anim.totalFrames - 1;
      if (reduced) {
        anim.goToAndStop(last, true);
        return;
      }
      const playhead = { frame: 0 };
      gsap.to(playhead, {
        frame: last,
        ease: 'none',
        scrollTrigger: { trigger: section.current, start: 'top top', end: '+=200%', pin: true, scrub, markers },
        onUpdate: () => {
          anim.goToAndStop(playhead.frame, true);
          if (frameLabel.current) frameLabel.current.textContent = `frame ${Math.round(playhead.frame)} / ${last}`;
        },
      });
    },
    { scope: section, dependencies: [...deps, anim], revertOnUpdate: true },
  );

  return (
    <>
      <ScrollIntro title="A Lottie timeline, played by your scroll wheel.">Built from code (scripts/gen-lottie.mjs). Toggle SVG vs canvas renderer in the Playground.</ScrollIntro>
      <section ref={section} className="relative grid h-screen place-items-center">
        <div ref={box} className="aspect-square w-[min(80vw,70vh)]" aria-hidden />
        <span ref={frameLabel} className="absolute bottom-10 font-mono text-sm text-dim">frame 0</span>
      </section>
      <ScrollOutro />
    </>
  );
}
