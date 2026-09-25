'use client';
// Detects a quality tier once per session: GPU benchmark (detect-gpu, served
// locally from /public/benchmarks — no CDN) + CPU/memory/save-data heuristics.
import { useEffect } from 'react';
import { useUI, type Tier } from '@/store/ui';

export function DeviceTier() {
  const setDetected = useUI((s) => s.setDetected);
  const setOsReduced = useUI((s) => s.setOsReduced);

  useEffect(() => {
    // OS reduced-motion preference, live
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => setOsReduced(mq.matches);
    onMq();
    mq.addEventListener('change', onMq);

    let cancelled = false;
    (async () => {
      const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
      const cores = nav.hardwareConcurrency ?? 4;
      const mem = nav.deviceMemory ?? 8;
      const saveData = nav.connection?.saveData ?? false;
      let tier: Tier = 'high';
      let gpu = 'unknown GPU';
      try {
        const { getGPUTier } = await import('detect-gpu');
        const r = await getGPUTier({ benchmarksURL: '/benchmarks' });
        gpu = r.gpu ?? r.type;
        tier = r.tier >= 3 ? 'high' : r.tier === 2 ? 'mid' : 'low';
        if (r.type === 'WEBGL_UNSUPPORTED' || r.type === 'BLOCKLISTED') tier = 'low';
      } catch {
        /* keep heuristics */
      }
      if (cores <= 4 || mem <= 4) tier = tier === 'high' ? 'mid' : tier;
      if (saveData) tier = 'low';
      if (!cancelled) setDetected(tier, gpu);
    })();

    return () => {
      cancelled = true;
      mq.removeEventListener('change', onMq);
    };
  }, [setDetected, setOsReduced]);

  return null;
}
