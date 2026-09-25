'use client';
// Lenis smooth scroll, driven by GSAP's ticker so there is exactly ONE rAF loop
// for scrolling + ScrollTrigger. Two independent loops is the #1 cause of
// ScrollTrigger jitter with smooth scroll.
import { ReactLenis, useLenis } from 'lenis/react';
import { useEffect, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function LenisGsapBridge() {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000); // gsap time is seconds
    gsap.ticker.add(tick);
    ScrollTrigger.refresh();
    return () => {
      gsap.ticker.remove(tick);
      lenis.off('scroll', ScrollTrigger.update);
    };
  }, [lenis]);
  return null;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  // Changing options re-creates the Lenis instance WITHOUT remounting children.
  // Reduced motion → smoothWheel off = plain native scrolling.
  return (
    <ReactLenis root options={{ autoRaf: false, lerp: 0.1, smoothWheel: !reduced, anchors: true }}>
      <LenisGsapBridge />
      {children}
    </ReactLenis>
  );
}
