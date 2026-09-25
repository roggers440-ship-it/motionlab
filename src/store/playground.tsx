'use client';
// Per-demo Playground store. One vanilla zustand store per demo page, provided
// through context. Two ways to consume a control:
//
//   useControl('stiffness')      → reactive value (re-renders the demo; fine for
//                                  props like spring configs that React must see)
//   useControlRef('strength')    → a ref kept in sync WITHOUT re-rendering; use
//                                  it in rAF / useFrame loops and shader uniforms
//
// This split is the whole trick behind "drag a slider at 60fps".
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';
import type { Control } from '@/demos/types';

type Values = Record<string, number | string | boolean>;
type PG = {
  values: Values;
  defaults: Values;
  replay: number;
  set: (key: string, v: number | string | boolean) => void;
  setMany: (v: Values) => void;
  reset: () => void;
  bumpReplay: () => void;
};

const Ctx = createContext<StoreApi<PG> | null>(null);

export function PlaygroundProvider({ controls, children }: { controls: Control[]; children: ReactNode }) {
  const [store] = useState(() => {
    const defaults = Object.fromEntries(controls.map((c) => [c.key, c.default])) as Values;
    return createStore<PG>()((set) => ({
      values: { ...defaults },
      defaults,
      replay: 0,
      set: (key, v) => set((s) => ({ values: { ...s.values, [key]: v } })),
      setMany: (v) => set((s) => ({ values: { ...s.values, ...v } })),
      reset: () => set((s) => ({ values: { ...s.defaults }, replay: s.replay + 1 })),
      bumpReplay: () => set((s) => ({ replay: s.replay + 1 })),
    }));
  });
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

const fallback = createStore<PG>()(() => ({
  values: {}, defaults: {}, replay: 0, set: () => {}, setMany: () => {}, reset: () => {}, bumpReplay: () => {},
}));

export function usePlaygroundStore() {
  return useContext(Ctx) ?? fallback;
}

export function usePlayground<T>(sel: (s: PG) => T) {
  return useStore(usePlaygroundStore(), sel);
}

export function useControl<T extends number | string | boolean>(key: string, fallbackValue: T): T {
  const v = usePlayground((s) => s.values[key]);
  return (v ?? fallbackValue) as T;
}

export function useControlRef<T extends number | string | boolean>(key: string, fallbackValue: T) {
  const store = usePlaygroundStore();
  const ref = useRef<T>((store.getState().values[key] ?? fallbackValue) as T);
  useEffect(
    () =>
      store.subscribe((s) => {
        const v = s.values[key];
        if (v !== undefined) ref.current = v as T;
      }),
    [store, key],
  );
  return ref;
}

/** Convenience: spring config from the standard spring controls. */
export function useSpringControls(defaults = { stiffness: 300, damping: 26, mass: 1 }) {
  const stiffness = useControl('stiffness', defaults.stiffness);
  const damping = useControl('damping', defaults.damping);
  const mass = useControl('mass', defaults.mass);
  const velocity = useControl('velocity', 0);
  return { type: 'spring' as const, stiffness, damping, mass, velocity };
}

/** Convenience: tween config from the standard tween controls. */
export function useTweenControls(defaults = { duration: 0.6 }) {
  const duration = useControl('duration', defaults.duration);
  const x1 = useControl('x1', 0.22);
  const y1 = useControl('y1', 1);
  const x2 = useControl('x2', 0.36);
  const y2 = useControl('y2', 1);
  const bezier = [x1, y1, x2, y2] as [number, number, number, number];
  return { duration, bezier, css: `cubic-bezier(${bezier.join(',')})` };
}
