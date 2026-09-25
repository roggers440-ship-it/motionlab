'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useTier } from '@/hooks/useTier';
import { ScrollIntro, ScrollOutro, useScrollSettings } from '@/components/shell/ScrollBits';

const TOTAL = 96;
const url = (i: number) => `/sequence/frame_${String(i).padStart(3, '0')}.webp`;
const BEATS = [
  { at: 0.05, t: 'Pre-rendered.', d: '96 raymarched frames, generated at build time.' },
  { at: 0.4, t: 'Decoded once.', d: 'createImageBitmap decodes off the main thread.' },
  { at: 0.75, t: 'Drawn on demand.', d: 'Scroll only picks which bitmap to drawImage().' },
];

export default function ImageSequence() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frames = useRef<ImageBitmap[]>([]);
  const [loaded, setLoaded] = useState(0);
  const tier = useTier();
  const step = tier === 'low' ? 2 : 1; // low tier: every 2nd frame = half the memory
  const { scrub, markers, reduced, deps } = useScrollSettings(0.5);

  // preload + decode
  useEffect(() => {
    let alive = true;
    const idx = Array.from({ length: Math.ceil(TOTAL / step) }, (_, i) => i * step);
    const list: ImageBitmap[] = [];
    let done = 0;
    Promise.all(
      idx.map(async (i, k) => {
        const blob = await fetch(url(i)).then((r) => r.blob());
        list[k] = await createImageBitmap(blob);
        if (alive) setLoaded(++done / idx.length);
      }),
    ).then(() => {
      if (!alive) return list.forEach((b) => b.close());
      frames.current = list;
      draw(0);
    });
    return () => {
      alive = false;
      frames.current.forEach((b) => b.close()); // free GPU/CPU memory
      frames.current = [];
    };
  }, [step]);

  const draw = (f: number) => {
    const c = canvas.current;
    const img = frames.current[Math.round(f)];
    if (!c || !img) return;
    const ctx = c.getContext('2d')!;
    // object-fit: cover
    const s = Math.max(c.width / img.width, c.height / img.height);
    const w = img.width * s;
    const h = img.height * s;
    ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
  };

  useEffect(() => {
    const c = canvas.current!;
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(devicePixelRatio, 2);
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      draw(0);
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      if (loaded < 1) return;
      const q = gsap.utils.selector(section);
      if (reduced) {
        draw(Math.floor(frames.current.length / 3));
        gsap.set(q('.beat'), { opacity: 1, position: 'relative' });
        return;
      }
      const state = { f: 0 };
      const n = frames.current.length - 1;
      const tl = gsap.timeline({ scrollTrigger: { trigger: section.current, start: 'top top', end: '+=300%', pin: true, scrub, markers } });
      tl.to(state, { f: n, ease: 'none', duration: 1, onUpdate: () => draw(state.f) }, 0);
      BEATS.forEach((b, i) => {
        tl.fromTo(q(`.beat-${i}`), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.08 }, b.at).to(q(`.beat-${i}`), { opacity: 0, y: -40, duration: 0.08 }, b.at + 0.2);
      });
    },
    { scope: section, dependencies: [...deps, loaded], revertOnUpdate: true },
  );

  return (
    <>
      <ScrollIntro title="Apple-style frame scrubbing.">The product turns as you scroll — no video decoder involved.</ScrollIntro>
      <section ref={section} className="relative h-screen overflow-hidden">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-label="Rotating product render controlled by scroll" />
        {loaded < 1 && (
          <div className="absolute inset-x-0 bottom-10 mx-auto w-64 text-center">
            <div className="h-1 rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--cat)]" style={{ width: `${loaded * 100}%` }} /></div>
            <p className="mt-2 font-mono text-xs text-dim">decoding frames {Math.round(loaded * 100)}%</p>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-end p-8 md:items-center md:p-16">
          {BEATS.map((b, i) => (
            <div key={b.t} className={`beat beat-${i} absolute max-w-md opacity-0`}>
              <h3 className="font-display text-5xl font-bold md:text-7xl">{b.t}</h3>
              <p className="mt-2 text-lg text-dim">{b.d}</p>
            </div>
          ))}
        </div>
      </section>
      <ScrollOutro />
    </>
  );
}
