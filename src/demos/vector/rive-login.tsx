'use client';
import dynamic from 'next/dynamic';
import { animate, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import { useControl } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Same inputs a Rive state machine would expose — the UI doesn't care which renderer runs.
export type CharacterInputs = { checking: boolean; look: number; handsUp: boolean; result: 'idle' | 'success' | 'fail'; resultId: number };

const RiveCharacter = dynamic(() => import('./rive-login.rive'), { ssr: false });

/** Code fallback: a Motion + SVG character implementing the same state machine. */
function CodeCharacter({ state }: { state: CharacterInputs }) {
  const reduced = useReducedMotion();
  const lookScale = useControl('lookScale', 1);
  const look = useMotionValue(50);
  const eyeX = useSpring(useTransform(look, [0, 100], [-9 * lookScale, 9 * lookScale]), { stiffness: 300, damping: 25 });
  const head = useMotionValue(0);
  useEffect(() => look.set(state.checking ? state.look : 50), [state.look, state.checking, look]);
  useEffect(() => {
    if (reduced) return;
    if (state.result === 'fail') animate(head, [0, -10, 10, -8, 8, 0], { duration: 0.6 });
    if (state.result === 'success') animate(head, [0, -14, 0], { duration: 0.5, ease: 'easeOut' });
  }, [state.resultId, state.result, reduced, head]);
  const eyeY = state.checking ? 6 : 0;
  const mouth = state.result === 'success' ? 'M78 128 Q100 150 122 128' : state.result === 'fail' ? 'M80 138 Q100 124 120 138' : 'M84 132 Q100 140 116 132';
  const spring = { type: 'spring', stiffness: 260, damping: 20 } as const;

  return (
    <motion.svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden style={{ rotate: head, y: useTransform(head, (v) => (state.result === 'success' ? v : 0)) }}>
      <circle cx="100" cy="108" r="78" fill="#2a2440" />
      <circle cx="46" cy="46" r="22" fill="#2a2440" />
      <circle cx="154" cy="46" r="22" fill="#2a2440" />
      <circle cx="46" cy="46" r="11" fill="#ff9ad5" />
      <circle cx="154" cy="46" r="11" fill="#ff9ad5" />
      <ellipse cx="100" cy="128" rx="44" ry="34" fill="#ecebf5" />
      {[72, 128].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="96" r="15" fill="#fff" />
          <motion.circle cx={cx} cy={96} r="7" fill="#07070b" style={{ x: eyeX }} animate={{ y: eyeY }} transition={spring} />
        </g>
      ))}
      <ellipse cx="100" cy="116" rx="10" ry="7" fill="#07070b" />
      <motion.path d={mouth} animate={{ d: mouth }} transition={spring} stroke="#07070b" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* paws: slide up to cover the eyes when the password field is focused */}
      {[[60, -1], [140, 1]].map(([cx, side]) => (
        <motion.ellipse key={cx} cx={cx} rx="30" ry="24" fill="#3a3358" stroke="#07070b" strokeWidth="2"
          initial={false} animate={{ cy: state.handsUp ? 96 : 230, rotate: state.handsUp ? side * -12 : 0 }} transition={reduced ? { duration: 0 } : spring} />
      ))}
    </motion.svg>
  );
}

export default function RiveLogin() {
  const [hasRiv, setHasRiv] = useState<boolean | null>(null);
  const forceFallback = useControl('forceFallback', false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<CharacterInputs>({ checking: false, look: 0, handsUp: false, result: 'idle', resultId: 0 });

  useEffect(() => {
    fetch('/rive/login.riv', { method: 'HEAD' }).then((r) => setHasRiv(r.ok)).catch(() => setHasRiv(false));
  }, []);

  const useRiv = hasRiv && !forceFallback;
  const onEmail = (v: string, caret: number) => {
    setEmail(v);
    setState((s) => ({ ...s, look: Math.min(100, caret * 3.5), result: 'idle' }));
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = /\S+@\S+\.\S+/.test(email);
    setState((s) => ({ ...s, handsUp: false, checking: false, result: ok ? 'success' : 'fail', resultId: s.resultId + 1 }));
  };

  return (
    <div className="grid h-full items-center gap-6 p-6 md:grid-cols-2 md:p-10">
      <div className="mx-auto aspect-square w-full max-w-[380px]">
        {hasRiv === null ? null : useRiv ? <RiveCharacter state={state} /> : <CodeCharacter state={state} />}
      </div>
      <form onSubmit={submit} className="mx-auto w-full max-w-sm space-y-4">
        <span className={`chip ${useRiv ? '!border-[var(--cat)] !text-fg' : ''}`}>
          Renderer: {useRiv ? 'Rive runtime (login.riv)' : 'Code fallback (Motion + SVG)'}
        </span>
        <label className="block space-y-1.5">
          <span className="text-sm text-dim">Email — the eyes follow your caret</span>
          <input type="email" value={email} autoComplete="off"
            onFocus={() => setState((s) => ({ ...s, checking: true, handsUp: false }))}
            onBlur={() => setState((s) => ({ ...s, checking: false }))}
            onChange={(e) => onEmail(e.target.value, e.target.selectionStart ?? e.target.value.length)}
            onSelect={(e) => onEmail(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)}
            className="w-full rounded-xl border border-line-2 bg-transparent px-4 py-3 outline-none focus:border-[var(--cat)]" placeholder="you@example.com" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-dim">Password — it covers its eyes</span>
          <input type="password" autoComplete="off"
            onFocus={() => setState((s) => ({ ...s, handsUp: true, checking: false }))}
            onBlur={() => setState((s) => ({ ...s, handsUp: false }))}
            className="w-full rounded-xl border border-line-2 bg-transparent px-4 py-3 outline-none focus:border-[var(--cat)]" placeholder="••••••••" />
        </label>
        <button className="btn btn-primary w-full !py-3">Log in (valid email = success)</button>
        <p aria-live="polite" className="font-mono text-xs text-mute">
          inputs → checking:{String(state.checking)} look:{Math.round(state.look)} handsUp:{String(state.handsUp)} result:{state.result}
        </p>
      </form>
    </div>
  );
}
