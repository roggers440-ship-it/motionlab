'use client';
import { useFrame } from '@react-three/fiber';
import { Environment, Float, Lightformer, MeshTransmissionMaterial, Text } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { Scene } from '@/components/three/Scene';
import { useControlRef } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTier } from '@/hooks/useTier';
import { useMediaQuery } from '@/hooks/useMediaQuery';

type MTM = THREE.Material & { thickness: number; ior: number; chromaticAberration: number; roughness: number };

function Glass({ geometry, position, scale = 1 }: { geometry: React.ReactNode; position: [number, number, number]; scale?: number }) {
  const mat = useRef<MTM>(null);
  const tier = useTier();
  const thickness = useControlRef('thickness', 1.2);
  const ior = useControlRef('ior', 1.5);
  const chroma = useControlRef('chroma', 0.06);
  const rough = useControlRef('roughness', 0.05);
  useFrame(() => {
    const m = mat.current;
    if (!m) return;
    m.thickness = thickness.current;
    m.ior = ior.current;
    m.chromaticAberration = chroma.current;
    m.roughness = rough.current;
  });
  return (
    <mesh position={position} scale={scale}>
      {geometry}
      <MeshTransmissionMaterial ref={mat as never} samples={tier === 'low' ? 4 : 8} resolution={tier === 'high' ? 512 : 256}
        transmission={1} anisotropy={0.2} distortion={0.3} distortionScale={0.4} temporalDistortion={0.1} backside={tier === 'high'} color="#ffffff" />
    </mesh>
  );
}

function Rig({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const tilt = useControlRef('tilt', 0.4);
  const reduced = useReducedMotion();
  useFrame((s, dt) => {
    if (!g.current || reduced) return;
    const k = 1 - Math.exp(-dt * 4); // frame-rate independent damping
    g.current.rotation.y += (s.pointer.x * tilt.current - g.current.rotation.y) * k;
    g.current.rotation.x += (-s.pointer.y * tilt.current * 0.6 - g.current.rotation.x) * k;
  });
  return <group ref={g}>{children}</group>;
}

export default function GlassHero() {
  const reduced = useReducedMotion();
  const narrow = useMediaQuery('(max-width: 767px)'); // pull the camera back on phones
  return (
    <div className="relative h-full">
      <Scene className="absolute inset-0" camera={{ position: [0, 0, narrow ? 11 : 7], fov: 40 }}>
        {/* procedural studio lighting — no HDR file download */}
        <Environment resolution={256}>
          <Lightformer intensity={3} position={[0, 4, -6]} scale={[10, 2, 1]} color="#ff6ec7" />
          <Lightformer intensity={2.5} position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#7c5cff" />
          <Lightformer intensity={2} position={[6, -1, 1]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} color="#38e1c6" />
          <Lightformer form="ring" intensity={4} position={[0, 0, 6]} scale={3} />
        </Environment>
        {/* text lives IN the scene so the glass can actually refract it (local font, no CDN) */}
        <Text font="/fonts/Poppins-Bold.ttf" fontSize={2.2} letterSpacing={-0.04} position={[0, 0, -2.5]} color="#ecebf5">
          GLASS
        </Text>
        <Rig>
          <Float speed={reduced ? 0 : 1.6} rotationIntensity={reduced ? 0 : 1.2} floatIntensity={reduced ? 0 : 1.4}>
            <Glass geometry={<torusKnotGeometry args={[0.9, 0.32, 220, 32]} />} position={[0, 0, 0]} />
          </Float>
          <Float speed={reduced ? 0 : 2.2} rotationIntensity={reduced ? 0 : 2} floatIntensity={reduced ? 0 : 2}>
            <Glass geometry={<icosahedronGeometry args={[0.55, 0]} />} position={[-2.6, 1.1, -0.5]} />
          </Float>
          <Float speed={reduced ? 0 : 1.8} rotationIntensity={reduced ? 0 : 1.5} floatIntensity={reduced ? 0 : 1.8}>
            <Glass geometry={<torusGeometry args={[0.5, 0.2, 32, 64]} />} position={[2.6, -1, 0.3]} />
          </Float>
          <Float speed={reduced ? 0 : 2.5} floatIntensity={reduced ? 0 : 2}>
            <Glass geometry={<sphereGeometry args={[0.35, 48, 48]} />} position={[2.1, 1.5, -1]} />
          </Float>
        </Rig>
      </Scene>
    </div>
  );
}
