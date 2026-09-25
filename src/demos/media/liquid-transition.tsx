'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Scene } from '@/components/three/Scene';
import { gsap } from '@/lib/gsap';
import { useControl, useControlRef } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const IMAGES = ['/images/art-1.jpg', '/images/art-2.jpg', '/images/art-3.jpg', '/images/art-4.jpg', '/images/art-5.jpg'];
const CAPTIONS = ['Aurora Fields', 'Tidal Glass', 'Ember Drift', 'Violet Hour', 'Moss Light'];

const fragment = /* glsl */ `
  uniform sampler2D uA; uniform sampler2D uB;
  uniform float uProgress; uniform float uIntensity; uniform float uScale;
  uniform vec2 uRes; uniform float uTime;
  varying vec2 vUv;
  // 2D simplex-ish value noise
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; } return v; }
  vec2 cover(vec2 uv) { float rs = uRes.x/uRes.y, ri = 1.6; vec2 s = rs > ri ? vec2(1.0, ri/rs) : vec2(rs/ri, 1.0); return (uv-0.5)*s+0.5; }
  void main() {
    vec2 uv = vUv;
    float n = fbm(uv * uScale + uTime * 0.05);
    // threshold sweeps from left to right, shaped by noise → liquid edge
    float edge = smoothstep(uProgress - 0.15, uProgress + 0.15, (uv.x * 0.6 + n * 0.8) * 0.72);
    float mixv = 1.0 - edge;
    vec2 dispA = vec2(n - 0.5) * uIntensity * uProgress;
    vec2 dispB = vec2(n - 0.5) * uIntensity * (1.0 - uProgress);
    vec3 a = texture2D(uA, cover(uv + dispA)).rgb;
    vec3 b = texture2D(uB, cover(uv - dispB)).rgb;
    float rim = smoothstep(0.0, 0.5, mixv) * smoothstep(1.0, 0.5, mixv);
    gl_FragColor = vec4(mix(a, b, mixv) + rim * 0.35, 1.0);
  }`;

function Liquid({ from, to, progress }: { from: number; to: number; progress: React.RefObject<{ v: number }> }) {
  const textures = useTexture(IMAGES);
  const size = useThree((s) => s.size);
  const intensity = useControlRef('intensity', 0.4);
  const scale = useControlRef('scale', 3);
  const uniforms = useMemo(
    () => ({ uA: { value: textures[0] }, uB: { value: textures[1] }, uProgress: { value: 0 }, uIntensity: { value: 0.4 }, uScale: { value: 3 }, uRes: { value: new THREE.Vector2() }, uTime: { value: 0 } }),
    [textures],
  );
  useFrame((_, dt) => {
    uniforms.uA.value = textures[from];
    uniforms.uB.value = textures[to];
    uniforms.uProgress.value = progress.current.v;
    uniforms.uIntensity.value = intensity.current;
    uniforms.uScale.value = scale.current;
    uniforms.uRes.value.set(size.width, size.height);
    uniforms.uTime.value += dt;
  });
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 10]} />
      <mesh>
        <planeGeometry args={[size.width, size.height]} />
        <shaderMaterial vertexShader="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }" fragmentShader={fragment} uniforms={uniforms} />
      </mesh>
    </>
  );
}

export default function LiquidTransition() {
  const [pair, setPair] = useState({ from: 0, to: 1 });
  const progress = useRef({ v: 0 });
  const busy = useRef(false);
  const duration = useControl('duration', 1.4);
  const autoplay = useControl('autoplay', false);
  const reduced = useReducedMotion();

  const go = (dir: 1 | -1) => {
    if (busy.current) return;
    busy.current = true;
    const to = (pair.from + dir + IMAGES.length) % IMAGES.length;
    setPair({ from: pair.from, to });
    progress.current.v = 0;
    gsap.to(progress.current, {
      v: 1,
      duration: reduced ? 0.25 : duration,
      ease: 'power2.inOut',
      onComplete: () => {
        setPair({ from: to, to });
        progress.current.v = 0;
        busy.current = false;
      },
    });
  };

  useEffect(() => {
    if (!autoplay || reduced) return;
    const id = setInterval(() => go(1), (duration + 1.5) * 1000);
    return () => clearInterval(id);
  });

  return (
    <div className="relative h-full" tabIndex={0} onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); }} onClick={() => go(1)}>
      <Scene className="absolute inset-0" customCamera>
        <Liquid from={pair.from} to={pair.to} progress={progress} />
      </Scene>
      <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between bg-gradient-to-t from-black/60 p-6">
        <p aria-live="polite" className="font-display text-3xl font-semibold">{CAPTIONS[pair.to === pair.from ? pair.from : pair.to]}</p>
        <div className="flex gap-2">
          <button className="btn !bg-black/40" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); go(-1); }}>←</button>
          <button className="btn !bg-black/40" aria-label="Next image" onClick={(e) => { e.stopPropagation(); go(1); }}>→</button>
        </div>
      </div>
    </div>
  );
}
