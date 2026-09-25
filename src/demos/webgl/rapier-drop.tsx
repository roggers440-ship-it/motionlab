'use client';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import { useCallback, useRef, useState } from 'react';
import { Scene } from '@/components/three/Scene';
import { useControl } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Body = { id: number; shape: 'ball' | 'box' | 'capsule'; pos: [number, number, number]; color: string; restitution: number };
const MAX = 150;
let uid = 0;
const COLORS = ['#ff6ec7', '#7c5cff', '#38e1c6', '#ffd479', '#ff8a5c', '#ecebf5'];

function Bowl() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[4, 0.2, 4]} position={[0, -2, 0]} />
      <CuboidCollider args={[0.2, 2, 4]} position={[-4, 0, 0]} />
      <CuboidCollider args={[0.2, 2, 4]} position={[4, 0, 0]} />
      <CuboidCollider args={[4, 2, 0.2]} position={[0, 0, -4]} />
      <CuboidCollider args={[4, 2, 0.2]} position={[0, 0, 4]} />
      <mesh position={[0, -2, 0]} receiveShadow>
        <boxGeometry args={[8, 0.4, 8]} />
        <meshStandardMaterial color="#1a1a28" />
      </mesh>
      {[[-4, 0, 0, 0.4, 4, 8], [4, 0, 0, 0.4, 4, 8], [0, 0, -4, 8, 4, 0.4]].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.05} />
        </mesh>
      ))}
    </RigidBody>
  );
}

function Spinner() {
  // a kinematic paddle stirring the pile
  const ref = useRef<import('@react-three/rapier').RapierRigidBody>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    ref.current?.setNextKinematicRotation({ x: 0, y: Math.sin(t / 2), z: 0, w: Math.cos(t / 2) });
  });
  return (
    <RigidBody ref={ref} type="kinematicPosition" colliders="cuboid" position={[0, -1.4, 0]}>
      <mesh>
        <boxGeometry args={[6, 0.6, 0.3]} />
        <meshStandardMaterial color="#7c5cff" />
      </mesh>
    </RigidBody>
  );
}

export default function RapierDrop() {
  const [bodies, setBodies] = useState<Body[]>([]);
  const restitution = useControl('restitution', 0.5);
  const gravity = useControl('gravity', -9.81);
  const batch = useControl('batch', 8);
  const reduced = useReducedMotion();

  const drop = useCallback(() => {
    setBodies((b) => {
      const add: Body[] = Array.from({ length: batch }, () => ({
        id: ++uid,
        shape: (['ball', 'box', 'capsule'] as const)[Math.floor(Math.random() * 3)],
        pos: [(Math.random() - 0.5) * 5, 5 + Math.random() * 4, (Math.random() - 0.5) * 5],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        restitution,
      }));
      return [...b, ...add].slice(-MAX); // recycle the oldest
    });
  }, [batch, restitution]);

  return (
    <div className="relative h-full cursor-pointer" onClick={drop}>
      <Scene className="absolute inset-0" camera={{ position: [0, 8, 13], fov: 40 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={2} />
        <Physics gravity={[0, gravity, 0]} paused={reduced} timeStep={1 / 60}>
          <Bowl />
          <Spinner />
          {bodies.map((b) => (
            <RigidBody key={b.id} position={b.pos} colliders={b.shape === 'ball' ? 'ball' : b.shape === 'capsule' ? 'hull' : 'cuboid'} restitution={b.restitution} friction={0.6}>
              <mesh>
                {b.shape === 'ball' && <sphereGeometry args={[0.35, 24, 24]} />}
                {b.shape === 'box' && <boxGeometry args={[0.6, 0.6, 0.6]} />}
                {b.shape === 'capsule' && <capsuleGeometry args={[0.2, 0.5, 6, 12]} />}
                <meshStandardMaterial color={b.color} roughness={0.35} />
              </mesh>
            </RigidBody>
          ))}
        </Physics>
      </Scene>
      <div className="absolute left-6 top-6 z-30 flex items-center gap-3">
        <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); drop(); }}>Drop {batch}</button>
        <button className="btn" onClick={(e) => { e.stopPropagation(); setBodies([]); }}>Clear</button>
        <span className="font-mono text-xs text-dim">{bodies.length}/{MAX} bodies</span>
      </div>
    </div>
  );
}
