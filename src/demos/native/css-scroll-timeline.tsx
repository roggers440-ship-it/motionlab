'use client';
import { useEffect, useRef, useState } from 'react';
import { ScrollIntro, ScrollOutro } from '@/components/shell/ScrollBits';

const STYLES = `
.sda-progress { position: fixed; inset: 64px 0 auto 0; height: 3px; z-index: 45; transform-origin: 0 50%; background: var(--cat); transform: scaleX(0); }
@supports (animation-timeline: view()) {
  .sda-progress { animation: sda-grow linear both; animation-timeline: scroll(root); }
  .sda-card { animation: sda-in linear both; animation-timeline: view(); animation-range: entry 0% cover 35%; }
  .sda-par img { animation: sda-par linear both; animation-timeline: view(); animation-range: cover 0% cover 100%; }
  .sda-word { animation: sda-light linear both; animation-timeline: view(); animation-range: cover 20% cover 45%; }
}
@keyframes sda-grow { to { transform: scaleX(1); } }
@keyframes sda-in { from { opacity: 0; transform: translateY(80px) scale(.94) rotate(-2deg); } to { opacity: 1; transform: none; } }
@keyframes sda-par { from { transform: translateY(-18%) scale(1.25); } to { transform: translateY(18%) scale(1.25); } }
@keyframes sda-light { from { opacity: .15; } to { opacity: 1; } }
@keyframes sda-spin { to { transform: rotate(1turn); } }
@media (prefers-reduced-motion: reduce) { .sda-card, .sda-par img, .sda-word, .sda-progress { animation: none !important; opacity: 1; transform: none; } }
`;

/** JS-driven spinner for comparison: stops whenever the main thread is busy. */
function JsSpinner() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0, a = 0;
    const loop = () => {
      a += 6;
      if (el.current) el.current.style.transform = `rotate(${a}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={el} className="size-16 rounded-xl border-4 border-[#ffd479] border-t-transparent" />;
}

export default function CssScrollTimeline() {
  const [supported, setSupported] = useState(true);
  const [blocking, setBlocking] = useState(false);
  useEffect(() => setSupported(typeof window !== 'undefined' && window.CSS?.supports?.('animation-timeline: view()')), []);

  const block = () => {
    setBlocking(true);
    // give React a frame to paint the label, then freeze the main thread
    requestAnimationFrame(() =>
      setTimeout(() => {
        const end = performance.now() + 1500;
        while (performance.now() < end) {
          /* busy */
        }
        setBlocking(false);
      }, 30),
    );
  };

  return (
    <div>
      <style>{STYLES}</style>
      <div className="sda-progress" aria-hidden />
      <ScrollIntro title="Scroll-driven animations with zero JavaScript.">
        Every effect on this page is a CSS keyframe bound to <code className="text-fg">animation-timeline</code>.
        {!supported && <span className="mt-2 block text-[#ffd479]">Your browser lacks scroll-driven animations — you are seeing the static fallback.</span>}
      </ScrollIntro>

      <section className="mx-auto mb-[20vh] flex max-w-[1400px] flex-wrap items-center gap-8 px-4 md:px-8">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl border-4 border-[var(--cat)] border-t-transparent" style={{ animation: 'sda-spin 1s linear infinite' }} />
          <span className="text-sm text-dim">CSS keyframes<br />(compositor)</span>
        </div>
        <div className="flex items-center gap-4">
          <JsSpinner />
          <span className="text-sm text-dim">requestAnimationFrame<br />(main thread)</span>
        </div>
        <button className="btn btn-primary" onClick={block} disabled={blocking}>{blocking ? 'Main thread blocked…' : 'Block main thread for 1.5s'}</button>
      </section>

      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 md:grid-cols-3 md:px-8">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <article key={n} className="sda-card overflow-hidden rounded-3xl border border-line bg-ink-2">
            <img src={`/images/art-${((n - 1) % 5) + 1}.jpg`} alt="" className="aspect-video w-full object-cover" />
            <div className="p-5">
              <p className="font-display text-xl font-semibold">view() card {n}</p>
              <p className="text-sm text-dim">animation-range: entry 0% cover 35%</p>
            </div>
          </article>
        ))}
      </div>

      <section className="sda-par relative mx-auto my-[20vh] h-[70vh] max-w-[1400px] overflow-hidden rounded-3xl px-4 md:px-8">
        <img src="/images/art-4.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <p className="relative grid h-full place-items-center font-display text-6xl font-bold md:text-8xl">Parallax, in CSS.</p>
      </section>

      <p className="mx-auto max-w-4xl px-4 font-display text-4xl font-semibold leading-tight md:text-6xl">
        {'Each word here lights up on its own view timeline — no SplitText, no ScrollTrigger.'.split(' ').map((w, i) => (
          <span key={i} className="sda-word">{w} </span>
        ))}
      </p>
      <ScrollOutro />
    </div>
  );
}
