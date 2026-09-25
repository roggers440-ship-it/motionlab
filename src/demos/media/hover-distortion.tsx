'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, useTexture } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Scene } from '@/components/three/Scene';
import { useControlRef } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const MODES = { wave: 0, ripple: 1, 'rgb-split': 2 } as const;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const fragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uRes;        // plane size (px)
  uniform vec2 uImg;        // image size (px)
  uniform vec2 uMouse;      // 0..1
  uniform float uHover;     // 0..1 (animated)
  uniform float uTime;
  uniform float uStrength;
  uniform float uFreq;
  uniform float uRadius;
  uniform int uMode;
  varying vec2 vUv;

  vec2 cover(vec2 uv) {     // CSS object-fit: cover, in the shader
    float rs = uRes.x / uRes.y, ri = uImg.x / uImg.y;
    vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
    float d = distance(uv * aspect, uMouse * aspect);
    float falloff = smoothstep(uRadius, 0.0, d) * uHover;
    vec3 col;
    if (uMode == 0) {                       // wave
      uv.x += sin(uv.y * uFreq + uTime * 2.0) * 0.03 * uStrength * falloff;
      uv.y += cos(uv.x * uFreq + uTime * 2.0) * 0.03 * uStrength * falloff;
      col = texture2D(uTex, cover(uv)).rgb;
    } else if (uMode == 1) {                // ripple from the cursor
      vec2 dir = normalize(uv - uMouse + 0.0001);
      uv += dir * sin(d * uFreq * 4.0 - uTime * 6.0) * 0.02 * uStrength * falloff;
      col = texture2D(uTex, cover(uv)).rgb;
    } else {                                // rgb split (chromatic aberration)
      vec2 off = (uv - uMouse) * 0.08 * uStrength * falloff;
      col.r = texture2D(uTex, cover(uv + off)).r;
      col.g = texture2D(uTex, cover(uv)).g;
      col.b = texture2D(uTex, cover(uv - off)).b;
    }
    col *= 1.0 + falloff * 0.12;
    gl_FragColor = vec4(col, 1.0);
  }`;

function Plane({ src, state }: { src: string; state: React.RefObject<{ hover: boolean; x: number; y: number }> }) {
  const tex = useTexture(src);
  const size = useThree((s) => s.size); // inside a View this is the view's size
  const reduced = useReducedMotion();
  const mode = useControlRef('mode', 'wave');
  const strength = useControlRef('strength', 0.5);
  const freq = useControlRef('frequency', 10);
  const radius = useControlRef('radius', 0.35);
  const uniforms = useMemo(
    () => ({
      uTex: { value: tex }, uRes: { value: new THREE.Vector2() }, uImg: { value: new THREE.Vector2(1600, 1000) }, uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 }, uTime: { value: 0 }, uStrength: { value: 0.5 }, uFreq: { value: 10 }, uRadius: { value: 0.35 }, uMode: { value: 0 },
    }),
    [tex],
  );
  const target = useMemo(() => new THREE.Vector2(), []); // reused → no per-frame allocation
  useFrame((_, dt) => {
    const s = state.current;
    uniforms.uRes.value.set(size.width, size.height);
    const img = tex.image as { width: number; height: number } | undefined;
    if (img) uniforms.uImg.value.set(img.width, img.height);
    uniforms.uMode.value = MODES[mode.current as keyof typeof MODES] ?? 0;
    uniforms.uStrength.value = strength.current;
    uniforms.uFreq.value = freq.current;
    uniforms.uRadius.value = radius.current;
    if (reduced) return void (uniforms.uHover.value = 0);
    uniforms.uTime.value += dt;
    const k = 1 - Math.exp(-dt * 6);
    uniforms.uHover.value += ((s.hover ? 1 : 0) - uniforms.uHover.value) * k;
    uniforms.uMouse.value.lerp(target.set(s.x, s.y), Math.min(1, k * 1.5));
  });
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={1} />
      <mesh>
        <planeGeometry args={[size.width, size.height]} />
        <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} />
      </mesh>
    </>
  );
}

function Card({ src, title }: { src: string; title: string }) {
  const state = useRef({ hover: false, x: 0.5, y: 0.5 });
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    state.current.x = (e.clientX - b.left) / b.width;
    state.current.y = 1 - (e.clientY - b.top) / b.height;
  };
  return (
    <figure className="group relative overflow-hidden rounded-2xl" onPointerEnter={() => (state.current.hover = true)} onPointerLeave={() => (state.current.hover = false)} onPointerMove={onMove}>
      {/* real image underneath: accessible + visible before WebGL is ready */}
      <img src={src} alt={`${title} — abstract generative artwork`} className="h-[46vh] min-h-[280px] w-full object-cover" />
      <Scene className="!absolute inset-0" customCamera>
        <Plane src={src} state={state} />
      </Scene>
      <figcaption className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/70 p-4 font-display text-xl font-semibold">{title}</figcaption>
    </figure>
  );
}

export default function HoverDistortion() {
  return (
    <div className="grid h-full content-center gap-4 overflow-auto p-4 md:grid-cols-3 md:p-6">
      <Card src="/images/art-1.jpg" title="Aurora" />
      <Card src="/images/art-2.jpg" title="Tidal" />
      <Card src="/images/art-3.jpg" title="Ember" />
    </div>
  );
}
