'use client';
import dynamic from 'next/dynamic';
import { MotionConfig } from 'motion/react';
import { FiberProvider } from 'its-fine';
import { useEffect, type ReactNode } from 'react';
import { useUI } from '@/store/ui';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SmoothScroll } from './SmoothScroll';
import { RouteRefresh } from './RouteRefresh';
import { DeviceTier } from './DeviceTier';

// The WebGL canvas never renders on the server.
const CanvasRoot = dynamic(() => import('./CanvasRoot'), { ssr: false });

function ReducedMotionSync() {
  const reduced = useReducedMotion();
  useEffect(() => {
    document.documentElement.dataset.reduced = String(reduced);
  }, [reduced]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    useUI.persist.rehydrate();
  }, []);
  const override = useUI((s) => s.reducedOverride);
  // Motion: 'user' follows the OS; the in-app override forces always/never.
  const reducedMotion = override === 'system' ? 'user' : override === 'on' ? 'always' : 'never';

  return (
    // FiberProvider lets <Scene> bridge React context into the shared canvas.
    <FiberProvider>
      <MotionConfig reducedMotion={reducedMotion}>
        <SmoothScroll>
          <DeviceTier />
          <ReducedMotionSync />
          <RouteRefresh />
          {children}
          <CanvasRoot />
        </SmoothScroll>
      </MotionConfig>
    </FiberProvider>
  );
}
