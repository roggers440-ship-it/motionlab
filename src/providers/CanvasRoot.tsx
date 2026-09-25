'use client';
// THE shared WebGL canvas. Every 3D demo renders into it through drei <View>
// (scissored viewports tracking DOM elements). One context for the whole site:
// no "Too many active WebGL contexts", no per-page context creation cost.
import { Canvas, useThree } from '@react-three/fiber';
import { View, Preload } from '@react-three/drei';
import { useEffect } from 'react';
import { useUI } from '@/store/ui';
import { useTier, dprForTier } from '@/hooks/useTier';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { GLStats } from '@/components/three/GLStats';

function LoopGuard() {
  const active = useUI((s) => s.activeViews);
  const reduced = useReducedMotion();
  const { gl, invalidate } = useThree();
  // Nothing mounted → wipe the last frame so stale pixels never linger.
  useEffect(() => {
    if (active === 0) gl.clear();
  }, [active, gl]);
  // Demand mode (reduced motion) still needs a redraw when views move on scroll.
  useEffect(() => {
    if (!reduced || !active) return;
    const on = () => invalidate();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, [reduced, active, invalidate]);
  return null;
}

export default function CanvasRoot() {
  const tier = useTier();
  const active = useUI((s) => s.activeViews);
  const reduced = useReducedMotion();
  const frameloop = active === 0 ? 'never' : reduced ? 'demand' : 'always';

  return (
    <Canvas
      eventSource={document.body}
      eventPrefix="client"
      frameloop={frameloop}
      dpr={dprForTier(tier)}
      gl={{ antialias: tier !== 'low', alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 20 }}
      aria-hidden
    >
      <View.Port />
      <LoopGuard />
      <GLStats />
      <Preload all />
    </Canvas>
  );
}
