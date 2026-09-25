'use client';
import { animate as motionAnimate, stagger as motionStagger } from 'motion';
import { useEffect, useRef, useState } from 'react';
import { CustomEase, gsap } from '@/lib/gsap';
import { useTweenControls } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const N = 6;
const STAGGER = 0.07;
type Engine = 'CSS' | 'WAAPI' | 'Motion' | 'GSAP';
const INFO: Record<Engine, { cost: string; thread: string }> = {
  CSS: { cost: '0 KB', thread: 'compositor' },
  WAAPI: { cost: '0 KB', thread: 'compositor' },
  Motion: { cost: '≈ 2.5 KB (animate)', thread: 'main (hybrid WAAPI)' },
  GSAP: { cost: '≈ 24 KB (core)', thread: 'main' },
};

function Lane({ engine, run, on }: { engine: Engine; run: number; on: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const { duration, bezier, css } = useTweenControls({ duration: 1 });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!run) return;
    const els = Array.from(root.current!.querySelectorAll<HTMLElement>('.dot'));
    const d = reduced ? 0.001 : duration;
    const x = (el: HTMLElement) => el.parentElement!.clientWidth - el.clientWidth;
    if (engine === 'WAAPI') {
      els.forEach((el, i) =>
        el.animate(
          [{ transform: `translateX(${on ? 0 : x(el)}px) rotate(${on ? 0 : 180}deg)` }, { transform: `translateX(${on ? x(el) : 0}px) rotate(${on ? 180 : 0}deg)` }],
          { duration: d * 1000, delay: i * STAGGER * 1000, easing: css, fill: 'forwards' },
        ),
      );
    }
    if (engine === 'Motion') {
      const ctl = motionAnimate(els, { x: on ? x(els[0]) : 0, rotate: on ? 180 : 0 }, { duration: d, delay: motionStagger(STAGGER), ease: bezier });
      return () => ctl.stop();
    }
    if (engine === 'GSAP') {
      const ease = CustomEase.create('four', `M0,0 C${bezier[0]},${bezier[1]} ${bezier[2]},${bezier[3]} 1,1`);
      const t = gsap.to(els, { x: on ? x(els[0]) : 0, rotate: on ? 180 : 0, duration: d, ease, stagger: STAGGER });
      return () => void t.kill();
    }
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={root} className="rounded-2xl border border-line bg-ink-2/60 p-4">
      <div className="mb-3 flex items-baseline gap-3">
        <h3 className="font-display text-xl font-semibold">{engine}</h3>
        <span className="font-mono text-[10px] text-mute">{INFO[engine].cost} · {INFO[engine].thread}</span>
      </div>
      <div className="space-y-2">
        {Array.from({ length: N }).map((_, i) => (
          <div key={i} className="relative h-6">
            <div className="dot absolute left-0 top-0 size-6 rounded-md"
              style={{
                background: `oklch(0.75 0.17 ${260 + i * 18})`,
                ...(engine === 'CSS' && {
                  // CSS: the transition does the work; the class/state flip just changes the target
                  transform: on ? 'translateX(calc(var(--lane) - 24px)) rotate(180deg)' : 'translateX(0) rotate(0deg)',
                  transition: `transform ${reduced ? 0 : duration}s ${css} ${i * STAGGER}s`,
                }),
              }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FourEngines() {
  const [run, setRun] = useState(0);
  const [on, setOn] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // CSS lane needs its width as a variable (percentages in translate refer to the element itself)
  useEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(() => el.style.setProperty('--lane', `${(el.querySelector('.dot')?.parentElement?.clientWidth ?? 300)}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const play = () => {
    setOn((o) => !o);
    setRun((r) => r + 1);
  };
  const stress = () => {
    play();
    setBlocked(true);
    setTimeout(() => {
      const end = performance.now() + 800;
      while (performance.now() < end) {
        /* block the main thread */
      }
      setBlocked(false);
    }, 60);
  };

  return (
    <div ref={wrap} className="flex h-full flex-col gap-4 overflow-auto p-4 md:p-6" data-lenis-prevent>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" onClick={play}>▶ Play all four</button>
        <button className="btn" onClick={stress} disabled={blocked}>{blocked ? 'Blocking…' : 'Play + block main thread 800ms'}</button>
        <span className="eyebrow">Same keyframes · same easing · same stagger</span>
      </div>
      <div className="grid flex-1 gap-3 md:grid-cols-2">
        {(['CSS', 'WAAPI', 'Motion', 'GSAP'] as Engine[]).map((e) => <Lane key={e} engine={e} run={run} on={on} />)}
      </div>
      <p className="text-sm text-dim">
        Under the stress test, CSS and WAAPI transform animations keep moving (they run on the compositor), while pure main-thread tweens freeze and then jump.
        Motion can hand some animations to WAAPI, so it often survives too — that is the hybrid engine at work.
      </p>
    </div>
  );
}
