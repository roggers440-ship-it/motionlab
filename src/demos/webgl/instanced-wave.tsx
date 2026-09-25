'use client';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Scene } from '@/components/three/Scene';
import { useControl, useControlRef } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function Field({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const amp = useControlRef('amp', 0.6);
  const speed = useControlRef('speed', 1.5);
  const reduced = useReducedMotion();
  const side = Math.round(Math.sqrt(count));
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uAmp: { value: 0.6 } }), []);

  // Per-instance positions are written ONCE. The wave happens in the vertex shader.
  useLayoutEffect(() => {
    const m = mesh.current!;
    const o = new THREE.Object3D();
    const gap = 16 / side;
    let i = 0;
    for (let x = 0; x < side; x++)
      for (let z = 0; z < side; z++) {
        o.position.set((x - side / 2) * gap, 0, (z - side / 2) * gap);
        o.scale.setScalar(gap * 0.8);
        o.updateMatrix();
        m.setMatrixAt(i++, o.matrix);
      }
    m.instanceMatrix.needsUpdate = true;
  }, [side]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uAmp = uniforms.uAmp;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uAmp; varying float vH;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vec3 ip = vec3(instanceMatrix[3]);
           float d = length(ip.xz);
           float h = sin(d * 0.9 - uTime) * 0.5 + 0.5;
           h = h * uAmp + sin(ip.x * 0.4 + uTime * 0.7) * uAmp * 0.25;
           transformed.y += h / instanceMatrix[1][1] + (position.y > 0.0 ? h * 2.5 : 0.0);
           vH = h;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vH;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(vec3(0.15,0.2,0.9), vec3(1.0,0.4,0.75), clamp(vH, 0.0, 1.0));');
    };
    return mat;
  }, [uniforms]);

  useFrame((_, dt) => {
    uniforms.uAmp.value = amp.current;
    if (!reduced) uniforms.uTime.value += dt * speed.current;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, side * side]} material={material} frustumCulled={false}>
      <boxGeometry />
    </instancedMesh>
  );
}

export default function InstancedWave() {
  const count = Number(useControl('count', '10000'));
  return (
    <div className="relative h-full">
      <Scene className="absolute inset-0" camera={{ position: [12, 9, 12], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 3]} intensity={2} />
        <group rotation={[0, Math.PI / 4, 0]} position={[0, -1.5, 0]}>
          <Field key={count} count={count} />
        </group>
      </Scene>
      <p className="eyebrow pointer-events-none absolute left-6 top-6 z-30">{count.toLocaleString()} instances · 1 draw call — check the HUD</p>
    </div>
  );
}
