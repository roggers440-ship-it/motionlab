'use client';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { useTweenControls } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const ITEMS = [1, 2, 3, 4, 5].map((n) => ({ id: n, img: `/images/art-${n}.jpg`, title: ['Aurora', 'Tidal', 'Ember', 'Violet', 'Moss'][n - 1] }));

export default function ViewTransitions() {
  const [selected, setSelected] = useState<number | null>(null);
  const { duration, css } = useTweenControls({ duration: 0.45 });
  const reduced = useReducedMotion();
  const supported = typeof document !== 'undefined' && 'startViewTransition' in document;

  const go = (next: number | null) => {
    // Browser snapshots the old state, we commit the new DOM synchronously, it morphs between them.
    if (!supported || reduced) return setSelected(next);
    document.startViewTransition(() => flushSync(() => setSelected(next)));
  };
  const item = ITEMS.find((i) => i.id === selected);

  return (
    <div className="h-full overflow-auto p-4 md:p-6" data-lenis-prevent>
      {/* animation timing for the ::view-transition pseudo-elements, driven by the Playground */}
      <style>{`
        ::view-transition-group(*) { animation-duration: ${duration}s; animation-timing-function: ${css}; }
        ::view-transition-old(root), ::view-transition-new(root) { animation-duration: ${duration * 0.6}s; }
      `}</style>
      <p className="mb-4 flex items-center gap-2">
        <span className={`chip ${supported ? '!border-[var(--cat)] !text-fg' : ''}`}>{supported ? 'View Transitions supported' : 'Not supported → instant swap'}</span>
        <span className="eyebrow">zero animation libraries on this demo</span>
      </p>
      {!item ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ITEMS.map((i) => (
            <button key={i.id} onClick={() => go(i.id)} className="overflow-hidden rounded-2xl bg-ink-3 text-left ring-1 ring-white/10">
              <img src={i.img} alt="" className="aspect-[4/5] w-full object-cover" style={{ viewTransitionName: `vt-img-${i.id}` }} />
              <p className="p-3 font-display text-lg font-semibold" style={{ viewTransitionName: `vt-title-${i.id}` }}>{i.title}</p>
            </button>
          ))}
        </div>
      ) : (
        <article className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <img src={item.img} alt="" className="aspect-[4/3] w-full rounded-3xl object-cover" style={{ viewTransitionName: `vt-img-${item.id}` }} />
          <div className="space-y-4 self-center">
            <h3 className="font-display text-5xl font-bold" style={{ viewTransitionName: `vt-title-${item.id}` }}>{item.title}</h3>
            <p className="text-dim">The image and title carry the same <code className="text-fg">view-transition-name</code> in both states, so the browser morphs them. Everything else cross-fades.</p>
            <button className="btn" onClick={() => go(null)}>← Back to grid</button>
          </div>
        </article>
      )}
    </div>
  );
}
