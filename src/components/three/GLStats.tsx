'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { glStats } from '@/lib/perf';

/**
 * Drop inside any <Canvas>. Reads renderer.info into a mutable bag every ~10
 * frames. autoReset is disabled because drei <View> renders several times per
 * frame — we want the per-frame total, not just the last view.
 */
export function GLStats() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.info.autoReset = false;
    glStats.active = true;
    return () => {
      glStats.active = false;
      gl.info.autoReset = true;
    };
  }, [gl]);
  let n = 0;
  useFrame(() => {
    if (++n % 10 === 0) {
      glStats.calls = gl.info.render.calls;
      glStats.triangles = gl.info.render.triangles;
      glStats.points = gl.info.render.points;
      glStats.geometries = gl.info.memory.geometries;
      glStats.textures = gl.info.memory.textures;
      glStats.programs = gl.info.programs?.length ?? 0;
      glStats.lastUpdate = performance.now();
    }
    gl.info.reset();
  });
  return null;
}
