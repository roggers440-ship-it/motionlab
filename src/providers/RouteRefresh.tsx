'use client';
// On client-side navigation: jump to top and let ScrollTrigger re-measure once
// the new page has laid out (two frames: commit → layout).
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useLenis } from 'lenis/react';
import { ScrollTrigger } from '@/lib/gsap';

export function RouteRefresh() {
  const pathname = usePathname();
  const lenis = useLenis();
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [pathname, lenis]);
  return null;
}
