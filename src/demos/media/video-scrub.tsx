'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { ScrollIntro, ScrollOutro, useScrollSettings } from '@/components/shell/ScrollBits';

export default function VideoScrub() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const readout = useRef<HTMLSpanElement>(null);
  const { scrub, markers, reduced, deps } = useScrollSettings(0.4);

  useEffect(() => {
    const v = video.current!;
    const ok = () => setReady(true);
    if (v.readyState >= 1) ok();
    v.addEventListener('loadedmetadata', ok);
    return () => v.removeEventListener('loadedmetadata', ok);
  }, []);

  useGSAP(
    () => {
      const v = video.current!;
      if (!ready) return;
      if (reduced) {
        v.currentTime = v.duration / 3;
        return;
      }
      const proxy = { t: 0 };
      let pending = false;
      gsap.to(proxy, {
        t: v.duration - 0.05,
        ease: 'none',
        scrollTrigger: { trigger: section.current, start: 'top top', end: '+=300%', pin: true, scrub, markers },
        onUpdate: () => {
          // coalesce seeks: never queue a new seek while one is in flight
          if (pending) return;
          pending = true;
          v.currentTime = proxy.t;
          v.addEventListener('seeked', () => (pending = false), { once: true });
          if (readout.current) readout.current.textContent = `${proxy.t.toFixed(2)}s / ${v.duration.toFixed(2)}s`;
        },
      });
    },
    { scope: section, dependencies: [...deps, ready], revertOnUpdate: true },
  );

  return (
    <>
      <ScrollIntro title="Scrub a real video with scroll.">Encoded all-intra (ffmpeg -g 1), so every seek lands on a keyframe. Compare with the canvas frame-sequence demo.</ScrollIntro>
      <section ref={section} className="relative h-screen overflow-hidden">
        <video ref={video} muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-cover" aria-label="Rotating render scrubbed by scroll">
          <source src="/video/orbit-scrub.webm" type="video/webm" />
          <source src="/video/orbit-scrub.mp4" type="video/mp4" />
        </video>
        <span ref={readout} className="absolute bottom-8 left-8 font-mono text-sm text-white/80">0.00s</span>
      </section>
      <ScrollOutro />
    </>
  );
}
