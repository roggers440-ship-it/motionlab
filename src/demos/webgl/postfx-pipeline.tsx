'use client';
// This demo deliberately uses its OWN <Canvas>: a full-screen EffectComposer
// can't run inside a scissored drei <View>. It pauses when offscreen.
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { Bloom, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing';
import type { BloomEffect, DepthOfFieldEffect } from 'postprocessing';
import { useRef } from 'react';
import * as THREE from 'three';
import { GLStats } from '@/components/three/GLStats';
import { useControl, useControlRef } from '@/store/playground';
import { useInView } from '@/hooks/useInView';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { dprForTier, useTier } from '@/hooks/useTier';

function Orbs() {
  const group = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  useFrame((s) => {
    if (reduced || !group.current) return;
    const t = s.clock.elapsedTime;
    group.current.children.forEach((c, i) => {
      c.position.y = 0.6 + Math.abs(Math.sin(t * 1.4 + i * 1.3)) * 1.4;
      c.rotation.x = t * 0.5 + i;
      c.rotation.z = t * 0.3 + i;
    });
    group.current.rotation.y = t * 0.15;
  });
  const items = [
    { p: [-2.4, 1, 0.8], c: '#ff6ec7', e: 3, g: 'ico' },
    { p: [0, 1, -1.5], c: '#7c5cff', e: 2.2, g: 'box' },
    { p: [2.2, 1, 0.4], c: '#38e1c6', e: 2.6, g: 'torus' },
    { p: [-0.8, 1, 2.4], c: '#ffd479', e: 1.8, g: 'sphere' },
    { p: [1.2, 1, 3.6], c: '#ffffff', e: 0, g: 'box' },
    { p: [-3.4, 1, -3], c: '#ff8a5c', e: 2.4, g: 'sphere' },
  ] as const;
  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh key={i} position={it.p as unknown as [number, number, number]} castShadow>
          {it.g === 'ico' && <icosahedronGeometry args={[0.6, 0]} />}
          {it.g === 'box' && <boxGeometry args={[0.8, 0.8, 0.8]} />}
          {it.g === 'torus' && <torusGeometry args={[0.45, 0.18, 24, 48]} />}
          {it.g === 'sphere' && <sphereGeometry args={[0.45, 32, 32]} />}
          <meshStandardMaterial color={it.c} emissive={it.c} emissiveIntensity={it.e} roughness={0.3} metalness={0.2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Effects() {
  const tier = useTier();
  const dofOn = useControl('dof', true);
  const bloom = useRef<BloomEffect>(null);
  const dof = useRef<DepthOfFieldEffect>(null);
  const intensity = useControlRef('bloom', 1.4);
  const threshold = useControlRef('threshold', 0.6);
  const focus = useControlRef('focus', 6);
  const bokeh = useControlRef('bokeh', 3);
  // update effect parameters in place — never re-create passes on slider drag
  useFrame(() => {
    if (bloom.current) {
      bloom.current.intensity = intensity.current;
      bloom.current.luminanceMaterial.threshold = threshold.current;
    }
    if (dof.current) {
      dof.current.bokehScale = bokeh.current;
      (dof.current.cocMaterial as unknown as { focusDistance: number }).focusDistance = focus.current;
    }
  });
  if (tier === 'low') return null; // no post FX at all on low tier
  return (
    <EffectComposer multisampling={tier === 'high' ? 4 : 0}>
      <Bloom ref={bloom} mipmapBlur intensity={1.4} luminanceThreshold={0.6} luminanceSmoothing={0.2} />
      {tier === 'high' && dofOn ? <DepthOfField ref={dof} focusDistance={6} focalLength={4} bokehScale={3} /> : <></>}
      <Vignette offset={0.25} darkness={0.7} />
    </EffectComposer>
  );
}

export default function PostFx() {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap);
  const tier = useTier();
  const reduced = useReducedMotion();
  return (
    <div ref={wrap} className="relative h-full">
      <Canvas shadows={tier !== 'low'} dpr={dprForTier(tier)} frameloop={inView ? (reduced ? 'demand' : 'always') : 'never'}
        camera={{ position: [0, 3.2, 8.5], fov: 42 }} gl={{ antialias: false, powerPreference: 'high-performance' }} className="!absolute inset-0">
        <color attach="background" args={['#07070b']} />
        <fog attach="fog" args={['#07070b', 10, 22]} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[4, 8, 3]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
        <Environment resolution={64}>
          <Lightformer intensity={0.6} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        </Environment>
        <Orbs />
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#121220" roughness={0.9} />
        </mesh>
        {tier === 'low' && <ContactShadows position={[0, 0.01, 0]} opacity={0.6} scale={14} blur={2} />}
        <Effects />
        <GLStats />
      </Canvas>
      <div className="pointer-events-none absolute left-6 top-6 z-30 space-y-1">
        <p className="eyebrow">Tier {tier}: {tier === 'high' ? 'bloom + DoF + vignette + soft shadows' : tier === 'mid' ? 'bloom + vignette + shadows' : 'no post FX, contact shadows only'}</p>
        <p className="eyebrow">Override the tier in Motion settings to compare costs.</p>
      </div>
    </div>
  );
}
