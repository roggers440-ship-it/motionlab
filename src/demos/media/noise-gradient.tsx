'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { Scene } from '@/components/three/Scene';
import { useControlRef } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const fragment = /* glsl */ `
  uniform float uTime; uniform float uScale; uniform float uWarp; uniform vec2 uRes;
  uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
  varying vec2 vUv;
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
  float snoise(vec2 v){ // Ashima 2D simplex noise
    const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
    vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
    vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
    vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
    vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m=m*m; m=m*m;
    vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
    m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
    vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.0*dot(m,g); }
  float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*snoise(p); p*=2.02; a*=0.5; } return v; }
  void main(){
    vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * uScale;
    vec2 q = vec2(fbm(p + uTime * 0.3), fbm(p + vec2(5.2, 1.3) - uTime * 0.2));
    float f = fbm(p + uWarp * q);                        // domain warping
    vec3 col = mix(uC1, uC2, smoothstep(-0.4, 0.6, f));
    col = mix(col, uC3, smoothstep(0.2, 0.9, length(q)));
    col += (fract(sin(dot(vUv * uRes, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.03; // dither: kills banding
    gl_FragColor = vec4(col, 1.0);
  }`;

function Gradient() {
  const size = useThree((s) => s.size);
  const reduced = useReducedMotion();
  const refs = {
    speed: useControlRef('speed', 0.25), scale: useControlRef('scale', 1.4), warp: useControlRef('warp', 1.2),
    c1: useControlRef('c1', '#120b2e'), c2: useControlRef('c2', '#ff4fa3'), c3: useControlRef('c3', '#4f7bff'),
  };
  const uniforms = useMemo(
    () => ({ uTime: { value: 3 }, uScale: { value: 1 }, uWarp: { value: 1 }, uRes: { value: new THREE.Vector2() }, uC1: { value: new THREE.Color() }, uC2: { value: new THREE.Color() }, uC3: { value: new THREE.Color() } }),
    [],
  );
  useFrame((_, dt) => {
    if (!reduced) uniforms.uTime.value += dt * refs.speed.current;
    uniforms.uScale.value = refs.scale.current;
    uniforms.uWarp.value = refs.warp.current;
    uniforms.uRes.value.set(size.width, size.height);
    uniforms.uC1.value.set(refs.c1.current);
    uniforms.uC2.value.set(refs.c2.current);
    uniforms.uC3.value.set(refs.c3.current);
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

export default function NoiseGradient() {
  return (
    <div className="relative h-full">
      <Scene className="absolute inset-0" customCamera>
        <Gradient />
      </Scene>
      <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="font-display text-6xl font-bold mix-blend-overlay md:text-8xl">Ambient</h3>
        <p className="mt-2 text-white/80">Domain-warped simplex noise · 1 fragment shader · pick your palette</p>
      </div>
    </div>
  );
}
