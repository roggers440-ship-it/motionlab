'use client';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLenis } from 'lenis/react';
import type { Control, DemoMeta } from '@/demos/types';
import { usePlayground, usePlaygroundStore } from '@/store/playground';
import { useUI } from '@/store/ui';
import { cn } from '@/lib/cn';
import { SpringGraph } from './SpringGraph';
import { BezierEditor } from './BezierEditor';
import { ExportMenu } from './ExportMenu';

function ControlRow({ c }: { c: Control }) {
  const value = usePlayground((s) => s.values[c.key]);
  const set = usePlayground((s) => s.set);
  const id = `pg-${c.key}`;

  if (c.type === 'range') {
    const n = Number(value);
    const fill = ((n - c.min) / (c.max - c.min)) * 100;
    const decimals = c.step < 0.001 ? 5 : c.step < 0.01 ? 3 : c.step < 1 ? 2 : 0;
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="flex justify-between text-xs">
          <span className="text-dim">{c.label}</span>
          <span className="font-mono tabular-nums text-fg">
            {n.toFixed(decimals)}
            {c.unit && <span className="text-mute"> {c.unit}</span>}
          </span>
        </label>
        <input id={id} type="range" min={c.min} max={c.max} step={c.step} value={n}
          style={{ '--fill': `${fill}%` } as React.CSSProperties}
          onChange={(e) => set(c.key, Number(e.target.value))} />
      </div>
    );
  }
  if (c.type === 'select') {
    return (
      <div className="space-y-1">
        <span className="text-xs text-dim">{c.label}</span>
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={c.label}>
          {c.options.map((o) => (
            <button key={o} role="radio" aria-checked={value === o} onClick={() => set(c.key, o)}
              className={cn('chip', value === o && '!border-[var(--cat)] !bg-[var(--cat-soft)] !text-fg')}>
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (c.type === 'toggle') {
    return (
      <label className="flex cursor-pointer items-center justify-between text-xs">
        <span className="text-dim">{c.label}</span>
        <button role="switch" aria-checked={!!value} onClick={() => set(c.key, !value)}
          className={cn('relative h-5 w-9 rounded-full transition-colors', value ? 'bg-[var(--cat)]' : 'bg-white/15')}>
          <motion.span layout transition={{ type: 'spring', stiffness: 700, damping: 35 }}
            className={cn('absolute top-0.5 size-4 rounded-full bg-white', value ? 'right-0.5' : 'left-0.5')} />
        </button>
      </label>
    );
  }
  return (
    <label className="flex items-center justify-between text-xs">
      <span className="text-dim">{c.label}</span>
      <span className="flex items-center gap-2 font-mono text-[10px] text-mute">
        {String(value)}
        <input type="color" value={String(value)} onChange={(e) => set(c.key, e.target.value)}
          className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" />
      </span>
    </label>
  );
}

/** Applies scroll-kind controls to the global Lenis instance, live. */
function LenisBinding() {
  const lenis = useLenis();
  const lerp = usePlayground((s) => s.values.lerp);
  useEffect(() => {
    if (!lenis || typeof lerp !== 'number') return;
    const prev = lenis.options.lerp;
    lenis.options.lerp = lerp;
    return () => {
      lenis.options.lerp = prev ?? 0.1;
    };
  }, [lenis, lerp]);
  return null;
}

function PanelBody({ meta }: { meta: DemoMeta }) {
  const pg = meta.playground!;
  const store = usePlaygroundStore();
  const v = usePlayground((s) => s.values);
  const reducedOverride = useUI((s) => s.reducedOverride);
  const setReduced = useUI((s) => s.setReducedOverride);
  const standard = new Set(pg.kind === 'spring' ? ['stiffness', 'damping', 'mass', 'velocity'] : pg.kind === 'tween' ? ['duration', 'x1', 'y1', 'x2', 'y2'] : []);
  const [springRows, otherRows] = [pg.controls.filter((c) => standard.has(c.key)), pg.controls.filter((c) => !standard.has(c.key))];

  return (
    <div className="space-y-4 overflow-y-auto p-3.5" data-lenis-prevent>
      {pg.kind === 'spring' && (
        <SpringGraph stiffness={+v.stiffness} damping={+v.damping} mass={+v.mass} velocity={+v.velocity} />
      )}
      {pg.kind === 'tween' && <BezierEditor />}
      <div className="space-y-3">
        {springRows.map((c) => <ControlRow key={c.key} c={c} />)}
        {springRows.length > 0 && otherRows.length > 0 && <hr className="border-line" />}
        {otherRows.map((c) => <ControlRow key={c.key} c={c} />)}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary !py-1.5 !text-xs" onClick={() => store.getState().bumpReplay()}>↻ Replay</button>
        <button className="btn !py-1.5 !text-xs" onClick={() => store.getState().reset()}>Reset</button>
        <button className="btn !py-1.5 !text-xs" aria-pressed={reducedOverride === 'on'}
          onClick={() => setReduced(reducedOverride === 'on' ? 'system' : 'on')}>
          {reducedOverride === 'on' ? '✓ ' : ''}Reduced preview
        </button>
      </div>
      <ExportMenu kind={pg.kind} />
    </div>
  );
}

export function PlaygroundPanel({ meta, docked = false }: { meta: DemoMeta; docked?: boolean }) {
  const pg = meta.playground!;
  const [open, setOpen] = useState(true);
  const dragControls = useDragControls();

  // start collapsed on small screens so the demo is visible first
  useEffect(() => {
    if (window.innerWidth < 768) setOpen(false);
  }, []);

  if (docked)
    return (
      <aside aria-label="Playground controls" className="glass sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-2xl">
        {pg.kind === 'scroll' && <LenisBinding />}
        <header className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
          <span className="size-2 rounded-full bg-[var(--cat)]" />
          <span className="font-display text-sm font-semibold">Playground</span>
          <span className="chip !py-0 !text-[9px] uppercase">{pg.kind}</span>
        </header>
        <PanelBody meta={meta} />
      </aside>
    );

  return (
    <>
      {pg.kind === 'scroll' && <LenisBinding />}
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.section key="panel" aria-label="Playground controls"
            drag dragListener={false} dragControls={dragControls} dragMomentum={false}
            initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="glass fixed bottom-3 right-3 z-40 flex max-h-[min(78vh,720px)] w-[min(340px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl shadow-2xl">
            <header className="flex cursor-grab touch-none items-center gap-2 border-b border-line px-3.5 py-2.5 active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}>
              <span className="size-2 rounded-full bg-[var(--cat)]" />
              <span className="font-display text-sm font-semibold">Playground</span>
              <span className="chip !py-0 !text-[9px] uppercase">{pg.kind}</span>
              <button className="ml-auto text-dim hover:text-fg" onClick={() => setOpen(false)} aria-label="Collapse playground">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" /></svg>
              </button>
            </header>
            <PanelBody meta={meta} />
          </motion.section>
        ) : (
          <motion.button key="pill" onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="btn btn-primary fixed bottom-3 right-3 z-40 shadow-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>
            Playground
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
