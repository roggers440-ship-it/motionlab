'use client';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer, PerspectiveCamera, RoundedBox } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { Scene } from '@/components/three/Scene';
import { gsap, useGSAP } from '@/lib/gsap';
import { useControlRef } from '@/store/playground';
import { ScrollIntro, ScrollOutro, useScrollSettings } from '@/components/shell/ScrollBits';

type Part = { name: string; dir: [number, number, number]; node: React.ReactNode };

const metal = <meshStandardMaterial color="#c9c7d9" metalness={0.9} roughness={0.25} />;
const PARTS: Part[] = [
  { name: 'Shell', dir: [0, -1.2, 0], node: <RoundedBox args={[2.4, 0.3, 1.6]} radius={0.12}>{metal}</RoundedBox> },
  { name: 'Board', dir: [0, -0.35, 0], node: <mesh><boxGeometry args={[2.1, 0.06, 1.35]} /><meshStandardMaterial color="#1f6f5c" roughness={0.6} /></mesh> },
  { name: 'Chip', dir: [0, 0.6, 0.2], node: <mesh position={[0.3, 0.08, 0]}><boxGeometry args={[0.5, 0.08, 0.5]} /><meshStandardMaterial color="#111" metalness={0.5} roughness={0.3} /></mesh> },
  { name: 'Battery', dir: [-1.3, 0.2, 0], node: <mesh position={[-0.55, 0.12, 0]}><boxGeometry args={[0.8, 0.14, 1]} /><meshStandardMaterial color="#ff6ec7" roughness={0.4} /></mesh> },
  { name: 'Fan', dir: [1.2, 0.5, -0.4], node: <mesh position={[0.35, 0.12, -0.35]} rotation-x={Math.PI / 2}><torusGeometry args={[0.22, 0.05, 16, 40]} /><meshStandardMaterial color="#7c5cff" metalness={0.6} roughness={0.3} /></mesh> },
  { name: 'Lens', dir: [0.8, 0.9, 1], node: <mesh position={[0.8, 0.2, 0.45]}><cylinderGeometry args={[0.16, 0.16, 0.12, 40]} /><meshStandardMaterial color="#38e1c6" emissive="#38e1c6" emissiveIntensity={0.6} /></mesh> },
  { name: 'Screen', dir: [0, 1.6, 0], node: <RoundedBox args={[2.3, 0.08, 1.5]} radius={0.04} position={[0, 0.25, 0]}><meshPhysicalMaterial color="#0b0b12" roughness={0.05} clearcoat={1} /></RoundedBox> },
];

function Device({ progress }: { progress: React.RefObject<number> }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const explode = useControlRef('explode', 2);
  const smooth = useRef(0);
  useFrame((_, dt) => {
    // exponential smoothing on top of ScrollTrigger scrub → silky even on jumpy wheels
    smooth.current += (progress.current - smooth.current) * (1 - Math.exp(-dt * 8));
    const p = smooth.current;
    const e = Math.sin(Math.min(1, p * 1.4) * Math.PI * 0.5); // explode in first ~70%
    refs.current.forEach((g, i) => {
      if (!g) return;
      const [x, y, z] = PARTS[i].dir;
      g.position.set(x * e * explode.current, y * e * explode.current, z * e * explode.current);
      g.rotation.y = e * (i % 2 ? 0.4 : -0.4);
    });
    if (cam.current) {
      const a = -0.6 + p * Math.PI * 0.9;
      cam.current.position.set(Math.sin(a) * 7, 2.5 + p * 2.5, Math.cos(a) * 7);
      cam.current.lookAt(0, 0.2, 0);
    }
  });
  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={38} position={[0, 3, 7]} />
      <Environment resolution={128}>
        <Lightformer intensity={3} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer intensity={2} position={[-5, 1, 3]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#ff6ec7" />
        <Lightformer intensity={2} position={[5, 1, -3]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} color="#7c5cff" />
      </Environment>
      <directionalLight position={[3, 6, 2]} intensity={1.5} />
      {PARTS.map((p, i) => (
        <group key={p.name} ref={(el) => { refs.current[i] = el; }}>
          {p.node}
        </group>
      ))}
    </>
  );
}

export default function ScrollDisassembly() {
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const { scrub, markers, reduced, deps } = useScrollSettings(1);

  useGSAP(
    () => {
      const q = gsap.utils.selector(section);
      if (reduced) {
        progress.current = 0.72; // static, exploded, labelled
        gsap.set(q('.plabel'), { opacity: 1 });
        return;
      }
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section.current, start: 'top top', end: '+=250%', pin: true, scrub, markers },
      });
      tl.to(progress, { current: 1, ease: 'none', duration: 1 }, 0);
      tl.fromTo(q('.plabel'), { opacity: 0, x: -20 }, { opacity: 1, x: 0, stagger: 0.04, duration: 0.1 }, 0.35);
      tl.to(q('.headline'), { opacity: 0, y: -40, duration: 0.15 }, 0.05);
    },
    { scope: section, dependencies: deps, revertOnUpdate: true },
  );

  return (
    <>
      <ScrollIntro title="Take it apart with your scroll wheel.">Progress is written into a ref; useFrame reads it. Zero React renders while scrolling.</ScrollIntro>
      <section ref={section} className="relative h-screen overflow-hidden">
        <Scene className="absolute inset-0" customCamera>
          <Device progress={progress} />
        </Scene>
        <h3 className="headline pointer-events-none absolute inset-x-0 top-[12%] z-30 text-center font-display text-5xl font-bold md:text-7xl">Device X</h3>
        <ul className="pointer-events-none absolute left-6 top-1/2 z-30 -translate-y-1/2 space-y-2 md:left-16">
          {PARTS.map((p, i) => (
            <li key={p.name} className="plabel flex items-center gap-3 opacity-0">
              <span className="font-mono text-xs text-mute">0{i + 1}</span>
              <span className="font-display text-xl">{p.name}</span>
            </li>
          ))}
        </ul>
      </section>
      <ScrollOutro />
    </>
  );
}
