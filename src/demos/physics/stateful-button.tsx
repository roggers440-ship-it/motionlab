'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useSpringControls } from '@/store/playground';

type State = 'idle' | 'loading' | 'success' | 'error';
// explicit finite state machine: which events are legal from which state
const machine: Record<State, Partial<Record<'CLICK' | 'RESOLVE' | 'REJECT' | 'RESET', State>>> = {
  idle: { CLICK: 'loading' },
  loading: { RESOLVE: 'success', REJECT: 'error' },
  success: { RESET: 'idle' },
  error: { RESET: 'idle', CLICK: 'loading' },
};

const LABEL: Record<State, string> = { idle: 'Place order', loading: 'Processing', success: 'Order placed', error: 'Try again' };
const BG: Record<State, string> = { idle: 'var(--cat)', loading: '#2a2940', success: '#38e1c6', error: '#ff5a6a' };

function Icon({ state }: { state: State }) {
  const draw = { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.35, ease: 'easeOut' } } as const;
  if (state === 'loading')
    return <motion.span key="spin" className="block size-5 rounded-full border-2 border-white/25 border-t-white" style={{ animation: 'ml-spin .7s linear infinite' }} />;
  if (state === 'success')
    return (
      <svg key="ok" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M4 12.5l5 5L20 6.5" {...draw} />
      </svg>
    );
  if (state === 'error')
    return (
      <svg key="err" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <motion.path d="M6 6l12 12" {...draw} />
        <motion.path d="M18 6L6 18" {...draw} transition={{ ...draw.transition, delay: 0.1 }} />
      </svg>
    );
  return null;
}

function MorphButton({ fail }: { fail: boolean }) {
  const [state, setState] = useState<State>('idle');
  const spring = useSpringControls({ stiffness: 400, damping: 30, mass: 1 });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const send = (ev: 'CLICK' | 'RESOLVE' | 'REJECT' | 'RESET') => setState((s) => machine[s][ev] ?? s);

  useEffect(() => {
    clearTimeout(timer.current);
    if (state === 'loading') timer.current = setTimeout(() => send(fail ? 'REJECT' : 'RESOLVE'), 1600);
    if (state === 'success') timer.current = setTimeout(() => send('RESET'), 2200);
    return () => clearTimeout(timer.current);
  }, [state, fail]);

  const compact = state === 'loading';
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button layout transition={spring} onClick={() => send('CLICK')} aria-disabled={state === 'loading' || state === 'success'}
        animate={{ backgroundColor: BG[state], color: state === 'idle' || state === 'success' ? '#07070b' : '#fff' }}
        style={{ borderRadius: 999 }}
        whileTap={state === 'idle' || state === 'error' ? { scale: 0.95 } : undefined}
        className="flex h-14 items-center justify-center gap-2.5 overflow-hidden px-7 font-display text-lg font-semibold">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={state} layout="position" className="flex items-center gap-2.5"
            initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
            transition={{ ...spring, opacity: { duration: 0.15 } }}>
            <Icon state={state} />
            {!compact && LABEL[state]}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <p aria-live="polite" className="font-mono text-xs text-mute">state: {state}</p>
    </div>
  );
}

export default function StatefulButton() {
  return (
    <div className="flex h-full flex-wrap items-center justify-center gap-16 p-6">
      <div className="text-center">
        <p className="eyebrow mb-6">resolves</p>
        <MorphButton fail={false} />
      </div>
      <div className="text-center">
        <p className="eyebrow mb-6">rejects</p>
        <MorphButton fail />
      </div>
    </div>
  );
}
