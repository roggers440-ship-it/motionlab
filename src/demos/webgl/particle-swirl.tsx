'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Scene } from '@/components/three/Scene';
import { useControlRef } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTier } from '@/hooks/useTier';

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uSpread;
  uniform float uSize;
  uniform float uBlast;
  uniform float uPixelRatio;
  attribute vec3 aSeed;           // x: radius 0..1, y: angle, z: random
  varying float vMix;
  varying float vAlpha;
  void main() {
    float r = pow(aSeed.x, 0.7) * 3.0 * uSpread;
    // inner particles orbit faster (Keplerian-ish) → natural spiral arms
    float a = aSeed.y + uTime * uSpeed * (0.6 / (r + 0.25)) + r * 1.3;
    vec3 p = vec3(cos(a) * r, (aSeed.z - 0.5) * 0.35 * (1.2 - aSeed.x), sin(a) * r);
    // blast: push outward, scaled by depth-random so the cloud tears apart in layers
    p += normalize(p + 0.0001) * uBlast * (1.0 + aSeed.z * 3.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.4 + aSeed.z) * (1.0 / -mv.z);
    vMix = aSeed.x;
    vAlpha = 0.55 + aSeed.z * 0.45;
  }`;

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vMix;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = pow(smoothstep(0.5, 0.0, d), 1.5) * 1.4;
    vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 0.9, vMix));
    gl_FragColor = vec4(col * 1.4, glow * vAlpha);
  }`;

function Galaxy({ blast }: { blast: React.RefObject<{ v: number; vel: number }> }) {
  const tier = useTier();
  const reduced = useReducedMotion();
  const count = tier === 'low' ? 15000 : tier === 'mid' ? 35000 : 60000;
  const speed = useControlRef('speed', 0.6);
  const spread = useControlRef('spread', 1);
  const size = useControlRef('size', 4);
  const colorA = useControlRef('colorA', '#ff6ec7');
  const colorB = useControlRef('colorB', '#5b8cff');
  const points = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seed = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      seed[i * 3] = Math.random();
      seed[i * 3 + 1] = Math.floor(Math.random() * 3) * ((Math.PI * 2) / 3) + (Math.random() - 0.5) * 0.9; // 3 arms
      seed[i * 3 + 2] = Math.random();
    }
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3)); // required by three, unused
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 }, uSpeed: { value: 0.6 }, uSpread: { value: 1 }, uSize: { value: 4 }, uBlast: { value: 0 },
      uPixelRatio: { value: 1 }, uColorA: { value: new THREE.Color() }, uColorB: { value: new THREE.Color() },
    }),
    [],
  );

  useFrame((s, dt) => {
    uniforms.uPixelRatio.value = s.gl.getPixelRatio() * 70;
    uniforms.uSpeed.value = speed.current;
    uniforms.uSpread.value = spread.current;
    uniforms.uSize.value = size.current;
    uniforms.uColorA.value.set(colorA.current);
    uniforms.uColorB.value.set(colorB.current);
    // critically-damped-ish spring back to 0 for the blast
    const b = blast.current;
    b.vel += (-b.v * 60 - b.vel * 9) * dt;
    b.v += b.vel * dt;
    uniforms.uBlast.value = Math.max(0, b.v);
    if (reduced) return;
    uniforms.uTime.value += dt;
    if (points.current) points.current.rotation.x = THREE.MathUtils.lerp(points.current.rotation.x, 0.5 + s.pointer.y * 0.3, 0.04);
  });

  return (
    <points ref={points} geometry={geometry} rotation={[0.5, 0, 0]}>
      <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function ParticleSwirl() {
  const blast = useRef({ v: 0, vel: 0 });
  const kick = () => (blast.current.vel += 14);
  return (
    <div className="relative h-full cursor-pointer" onClick={kick}>
      <Scene className="absolute inset-0" camera={{ position: [0, 1.5, 7], fov: 50 }}>
        <Galaxy blast={blast} />
      </Scene>
      <div className="pointer-events-none absolute left-6 top-6 z-30">
        <p className="eyebrow">Click anywhere to blast · all motion runs in the vertex shader</p>
      </div>
      <button className="btn absolute bottom-6 right-6 z-30" onClick={(e) => { e.stopPropagation(); kick(); }}>Blast</button>
    </div>
  );
}
