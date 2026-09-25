'use client';
import { selectTier, useUI, type Tier } from '@/store/ui';

export const useTier = () => useUI(selectTier);

/** Per-tier lookup: pick({ high: 2, mid: 1.5, low: 1 }) */
export function useTierValue<T>(values: Record<Tier, T>): T {
  return values[useTier()];
}

export const dprForTier = (tier: Tier): [number, number] =>
  tier === 'high' ? [1, 2] : tier === 'mid' ? [1, 1.5] : [0.75, 1];
