'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { CustomEase, Flip, gsap } from '@/lib/gsap';
import { useTweenControls } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

const CATS = ['All', 'Warm', 'Cool', 'Neutral'] as const;
const ITEMS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  img: `/images/art-${(i % 5) + 1}.jpg`,
  cat: (['Warm', 'Cool', 'Neutral'] as const)[i % 3],
  title: ['Ember', 'Tide', 'Ash', 'Coral', 'Frost', 'Stone', 'Flare', 'Mist', 'Slate', 'Dune', 'Glacier', 'Clay'][i],
}));

export default function FlipGrid() {
  const root = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [cat, setCat] = useState<(typeof CATS)[number]>('All');
  const { duration, bezier } = useTweenControls({ duration: 0.7 });
  const reduced = useReducedMotion();

  // 1) capture state BEFORE React changes the DOM
  const change = (fn: () => void) => {
    flipState.current = Flip.getState(root.current!.querySelectorAll('.item'), { props: 'opacity' });
    fn();
  };

  // 2) after the DOM changed, animate from the captured state
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state) return;
    flipState.current = null;
    if (reduced) return;
    const ease = CustomEase.create('flip-ease', `M0,0 C${bezier[0]},${bezier[1]} ${bezier[2]},${bezier[3]} 1,1`);
    Flip.from(state, {
      duration,
      ease,
      absolute: true,
      nested: true,
      stagger: 0.02,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: duration * 0.8, ease }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.6, duration: duration * 0.6, ease }),
    });
  }, [layout, cat, duration, bezier, reduced]);

  return (
    <div ref={root} className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {CATS.map((c) => (
          <button key={c} aria-pressed={cat === c} onClick={() => change(() => setCat(c))} className={cn('chip !px-3 !py-1 !text-xs', cat === c && '!border-[var(--cat)] !text-fg')}>{c}</button>
        ))}
        <div className="ml-auto flex gap-1">
          {(['grid', 'list'] as const).map((l) => (
            <button key={l} aria-pressed={layout === l} onClick={() => change(() => setLayout(l))} className={cn('btn !py-1 !text-xs', layout === l && '!border-[var(--cat)]')}>{l}</button>
          ))}
        </div>
      </div>
      <div className={cn('relative flex-1 overflow-y-auto', layout === 'grid' ? 'grid auto-rows-[150px] grid-cols-2 gap-3 md:grid-cols-4' : 'flex flex-col gap-2')} data-lenis-prevent>
        {ITEMS.map((it) => {
          // hidden items stay in the DOM (display:none) so Flip can animate them in/out
          const hidden = cat !== 'All' && it.cat !== cat;
          return (
            <div key={it.id} data-flip-id={`i-${it.id}`}
              className={cn('item relative overflow-hidden rounded-2xl ring-1 ring-white/10', hidden && 'hidden', layout === 'grid' ? '' : 'flex h-20 shrink-0 items-center gap-4 bg-ink-3 pr-4')}>
              <img data-flip-id={`img-${it.id}`} src={it.img} alt="" className={layout === 'grid' ? 'absolute inset-0 h-full w-full object-cover' : 'h-20 w-28 object-cover'} />
              <div className={layout === 'grid' ? 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-3' : ''}>
                <p className="font-display font-semibold">{it.title}</p>
                <p className="font-mono text-[10px] uppercase text-dim">{it.cat}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
