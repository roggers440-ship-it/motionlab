'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Scene } from '@/components/three/Scene';
import { useControlRef } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const vertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uStrength;
  uniform float uFreq;
  varying float vDisp;
  varying vec3 vNormal;
  void main() {
    vec3 p = position;
    // distance from this vertex (in sphere-projected 2D) to the cursor
    float d = distance(normalize(p).xy, uMouse);
    float wave = sin(d * uFreq - uTime) * exp(-d * 3.0);
    p += normal * wave * uStrength;
    vDisp = wave;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;

const fragment = /* glsl */ `
  varying float vDisp;
  varying vec3 vNormal;
  void main() {
    vec3 a = vec3(0.12, 0.16, 0.85);
    vec3 b = vec3(1.0, 0.35, 0.78);
    vec3 col = mix(a, b, clamp(vDisp * 1.6 + 0.5, 0.0, 1.0));
    float rim = pow(1.0 - abs(vNormal.z), 2.5);       // fresnel-ish rim light
    col += rim * vec3(0.5, 0.8, 1.0) * 0.8;
    gl_FragColor = vec4(col, 1.0);
  }`;

function Blob() {
  const mesh = useRef<THREE.Mesh>(null);
  const reduced = useReducedMotion();
  const strength = useControlRef('strength', 0.25);
  const freq = useControlRef('frequency', 12);
  const speed = useControlRef('speed', 2);
  // uniforms are created once; the Playground writes into .value every frame → zero React renders
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() }, uStrength: { value: 0.25 }, uFreq: { value: 12 } }), []);

  useFrame((state, dt) => {
    uniforms.uStrength.value = strength.current;
    uniforms.uFreq.value = freq.current;
    if (reduced || !mesh.current) return;
    uniforms.uTime.value += dt * speed.current;
    uniforms.uMouse.value.lerp(state.pointer, 0.08);
    const m = mesh.current;
    m.rotation.x = THREE.MathUtils.lerp(m.rotation.x, state.pointer.y * 0.35, 0.05);
    m.rotation.y = THREE.MathUtils.lerp(m.rotation.y, state.pointer.x * 0.35, 0.05);
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.35, 96]} />
      <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} />
    </mesh>
  );
}

export default function CursorBlob() {
  return (
    <div className="relative h-full">
      <Scene className="absolute inset-0" camera={{ position: [0, 0, 4.6] }}>
        <Blob />
      </Scene>
      <p className="eyebrow pointer-events-none absolute left-6 top-6 z-30">Move the cursor over the blob</p>
    </div>
  );
}
