'use client';
import { useEffect, useRef, useState } from 'react';
import type { AnimationItem } from 'lottie-web';
import { useControl } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function LottieToggle({ src, label, bg }: { src: string; label: string; bg: string }) {
  const box = useRef<HTMLDivElement>(null);
  const anim = useRef<AnimationItem | null>(null);
  const [on, setOn] = useState(false);
  const speed = useControl('speed', 1);
  const reduced = useReducedMotion();

  useEffect(() => {
    let alive = true;
    import('lottie-web').then(({ default: lottie }) => {
      if (!alive || !box.current) return;
      anim.current = lottie.loadAnimation({ container: box.current, renderer: 'svg', loop: false, autoplay: false, path: src });
    });
    return () => {
      alive = false;
      anim.current?.destroy();
    };
  }, [src]);

  useEffect(() => anim.current?.setSpeed(speed), [speed]);

  const toggle = () => {
    const a = anim.current;
    const next = !on;
    setOn(next);
    if (!a) return;
    const end = a.totalFrames - 1;
    if (reduced) return a.goToAndStop(next ? end : 0, true);
    // play forward or backward from wherever it currently is → interruptible toggle
    const cur = Math.round(a.currentFrame);
    a.playSegments(next ? [cur, end] : [cur, 0], true);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button onClick={toggle} aria-pressed={on} aria-label={label} className="grid size-28 place-items-center rounded-3xl transition-transform active:scale-95" style={{ background: bg }}>
        <div ref={box} className="size-20" aria-hidden />
      </button>
      <span className="font-mono text-xs text-dim">{label}: {on ? 'on' : 'off'}</span>
    </div>
  );
}

export default function LottieToggles() {
  return (
    <div className="flex h-full flex-wrap items-center justify-center gap-10 p-6">
      <LottieToggle src="/lottie/menu.json" label="Menu" bg="#1d1b2c" />
      <LottieToggle src="/lottie/heart.json" label="Like" bg="#1d1b2c" />
      <LottieToggle src="/lottie/check.json" label="Done" bg="#1d1b2c" />
    </div>
  );
}
