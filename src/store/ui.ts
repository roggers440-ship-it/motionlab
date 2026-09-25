'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Tier = 'high' | 'mid' | 'low';
export type ReducedOverride = 'system' | 'on' | 'off';

type UIState = {
  // reduced motion = OS setting unless the visitor overrides it in-app
  osReduced: boolean;
  reducedOverride: ReducedOverride;
  // device quality tier = detected unless overridden
  detectedTier: Tier;
  tierOverride: 'auto' | Tier;
  gpu: string;
  hud: boolean;
  // number of mounted <Scene> views → the shared canvas only loops when > 0
  activeViews: number;
  setOsReduced: (v: boolean) => void;
  setReducedOverride: (v: ReducedOverride) => void;
  setDetected: (tier: Tier, gpu: string) => void;
  setTierOverride: (v: 'auto' | Tier) => void;
  toggleHud: () => void;
  addView: (n: 1 | -1) => void;
};

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      osReduced: false,
      reducedOverride: 'system',
      detectedTier: 'high',
      tierOverride: 'auto',
      gpu: 'detecting…',
      hud: true,
      activeViews: 0,
      setOsReduced: (osReduced) => set({ osReduced }),
      setReducedOverride: (reducedOverride) => set({ reducedOverride }),
      setDetected: (detectedTier, gpu) => set({ detectedTier, gpu }),
      setTierOverride: (tierOverride) => set({ tierOverride }),
      toggleHud: () => set((s) => ({ hud: !s.hud })),
      addView: (n) => set((s) => ({ activeViews: Math.max(0, s.activeViews + n) })),
    }),
    {
      name: 'motionlab-ui',
      skipHydration: true, // rehydrated in <Providers> after mount → no SSR mismatch
      storage: createJSONStorage(() => localStorage),
      // only persist visitor choices, never runtime/detected values
      partialize: (s) => ({ reducedOverride: s.reducedOverride, tierOverride: s.tierOverride, hud: s.hud }),
    },
  ),
);

export const selectReduced = (s: UIState) => (s.reducedOverride === 'system' ? s.osReduced : s.reducedOverride === 'on');
export const selectTier = (s: UIState): Tier => (s.tierOverride === 'auto' ? s.detectedTier : s.tierOverride);
