'use client';
// A generative take on Nepali Dhaka cloth (the fabric of the Dhaka topi):
// bands of nested diamonds, chevrons and stripes, quantised to a thread grid
// so it reads as woven. One fragment shader, rendered through the shared canvas.
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Scene } from '@/components/three/Scene';
import { useControlRef } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const fragment = /* glsl */ `
  uniform float uTime; uniform float uThreads; uniform float uWeave; uniform vec2 uRes; uniform vec2 uMouse;
  varying vec2 vUv;

  const vec3 RED = vec3(0.70, 0.12, 0.16);
  const vec3 MAROON = vec3(0.36, 0.06, 0.11);
  const vec3 BLACK = vec3(0.07, 0.05, 0.06);
  const vec3 CREAM = vec3(0.95, 0.90, 0.82);
  const vec3 ORANGE = vec3(0.90, 0.47, 0.17);
  const vec3 GREEN = vec3(0.13, 0.42, 0.27);

  // nested diamonds (the classic Dhaka motif)
  vec3 diamonds(vec2 p) {
    vec2 f = fract(p) - 0.5;
    float d = abs(f.x) + abs(f.y);
    float ring = floor(d * 8.0);
    int k = int(mod(ring, 4.0));
    return k == 0 ? CREAM : k == 1 ? RED : k == 2 ? BLACK : ORANGE;
  }
  // zig-zag chevrons
  vec3 chevrons(vec2 p) {
    float tri = abs(fract(p.x) - 0.5);
    float v = fract(p.y * 1.5 + tri * 1.5);
    return v < 0.33 ? RED : v < 0.66 ? BLACK : CREAM;
  }
  // narrow separator stripes
  vec3 stripes(float y) {
    int k = int(mod(floor(y * 6.0), 3.0));
    return k == 0 ? MAROON : k == 1 ? ORANGE : GREEN;
  }

  void main() {
    vec2 uv = vUv * vec2(uRes.x / uRes.y, 1.0);
    // snap to the thread grid → woven, pixel-like look
    vec2 grid = floor(uv * uThreads) / uThreads;
    vec2 p = grid * 4.0 + vec2(uTime * 0.15, 0.0);
    // gentle bulge around the cursor, like pressing on fabric
    float m = smoothstep(0.35, 0.0, distance(vUv, uMouse));
    p += (vUv - uMouse) * m * 0.8;

    float band = fract(p.y * 0.5);              // repeating vertical layout of bands
    vec3 col = band < 0.42 ? diamonds(p * vec2(1.0, 1.0))
             : band < 0.50 ? stripes(p.y)
             : band < 0.92 ? chevrons(p * vec2(1.0, 1.0))
             : stripes(p.y + 0.5);

    // weave texture: alternating warp/weft threads darken slightly
    vec2 t = fract(uv * uThreads);
    float warp = mod(floor(uv.x * uThreads) + floor(uv.y * uThreads), 2.0);
    float thread = mix(0.82, 1.0, warp) * (0.9 + 0.1 * sin(t.x * 6.2831) * sin(t.y * 6.2831));
    col *= mix(1.0, thread, uWeave);
    col *= 1.0 + m * 0.15;
    gl_FragColor = vec4(col, 1.0);
  }`;

function Cloth({ mouse }: { mouse: React.RefObject<{ x: number; y: number }> }) {
  const size = useThree((s) => s.size);
  const reduced = useReducedMotion();
  const speed = useControlRef('speed', 0.4);
  const threads = useControlRef('threads', 90);
  const weave = useControlRef('weave', 0.8);
  const target = useMemo(() => new THREE.Vector2(0.5, 0.5), []);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uThreads: { value: 90 }, uWeave: { value: 0.8 }, uRes: { value: new THREE.Vector2() }, uMouse: { value: new THREE.Vector2(-1, -1) } }),
    [],
  );
  useFrame((_, dt) => {
    if (!reduced) uniforms.uTime.value += dt * speed.current;
    uniforms.uThreads.value = threads.current;
    uniforms.uWeave.value = weave.current;
    uniforms.uRes.value.set(size.width, size.height);
    uniforms.uMouse.value.lerp(target.set(mouse.current.x, mouse.current.y), 0.1);
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

export default function DhakaWeave() {
  const mouse = useRef({ x: -1, y: -1 });
  return (
    <div className="relative h-full"
      onPointerMove={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        mouse.current = { x: (e.clientX - b.left) / b.width, y: 1 - (e.clientY - b.top) / b.height };
      }}
      onPointerLeave={() => (mouse.current = { x: -1, y: -1 })}>
      <Scene className="absolute inset-0" customCamera>
        <Cloth mouse={mouse} />
      </Scene>
      <div className="pointer-events-none absolute bottom-6 left-6 z-30 rounded-2xl bg-black/50 px-4 py-3 backdrop-blur">
        <p className="font-display text-2xl font-semibold" lang="ne">ढाका</p>
        <p className="text-sm text-white/75">Generative Dhaka weave · move over it to press the fabric</p>
      </div>
    </div>
  );
}
