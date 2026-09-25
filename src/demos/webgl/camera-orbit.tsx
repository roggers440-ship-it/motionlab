'use client';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Scene } from '@/components/three/Scene';
import { gsap, useGSAP } from '@/lib/gsap';
import { ScrollIntro, ScrollOutro, useScrollSettings } from '@/components/shell/ScrollBits';

const COUNT = 400;

function World({ progress }: { progress: React.RefObject<number> }) {
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const smooth = useRef(0);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [[0, 2, 30], [6, 3, 18], [-4, 1.5, 6], [3, 4, -6], [-6, 2, -18], [0, 6, -32]].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      ),
    [],
  );
  const look = useMemo(() => new THREE.Vector3(), []);

  // one InstancedMesh for all monoliths → 1 draw call
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      const t = Math.random();
      const p = curve.getPointAt(t);
      const side = Math.random() > 0.5 ? 1 : -1;
      o.position.set(p.x + side * (3 + Math.random() * 10), 0, p.z + (Math.random() - 0.5) * 6);
      const h = 1 + Math.random() * 8;
      o.scale.set(0.6 + Math.random(), h, 0.6 + Math.random());
      o.position.y = h / 2 - 2;
      o.updateMatrix();
      mesh.current!.setMatrixAt(i, o.matrix);
      mesh.current!.setColorAt(i, c.setHSL(0.72 + Math.random() * 0.25, 0.7, 0.35 + Math.random() * 0.3));
    }
    mesh.current!.instanceMatrix.needsUpdate = true;
    mesh.current!.instanceColor!.needsUpdate = true;
  }, [curve]);

  useFrame((_, dt) => {
    smooth.current += (progress.current - smooth.current) * (1 - Math.exp(-dt * 6));
    const t = Math.min(0.999, smooth.current);
    cam.current?.position.copy(curve.getPointAt(t));
    look.copy(curve.getPointAt(Math.min(1, t + 0.02)));
    cam.current?.lookAt(look);
  });

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={60} />
      <fog attach="fog" args={['#0b0718', 8, 45]} />
      <color attach="background" args={['#0b0718']} />
      <hemisphereLight args={['#ff9ad5', '#1a1040', 1.2]} />
      <directionalLight position={[10, 20, 5]} intensity={1.5} />
      <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -2, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#120a26" />
      </mesh>
    </>
  );
}

export default function CameraOrbit() {
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const { scrub, markers, reduced, deps } = useScrollSettings(1.5);

  useGSAP(
    () => {
      if (reduced) {
        progress.current = 0.5;
        return;
      }
      gsap.to(progress, { current: 1, ease: 'none', scrollTrigger: { trigger: section.current, start: 'top top', end: '+=300%', pin: true, scrub, markers } });
    },
    { scope: section, dependencies: deps, revertOnUpdate: true },
  );

  return (
    <>
      <ScrollIntro title="Fly through with your scroll wheel.">The camera rides a CatmullRom spline; 400 monoliths are a single instanced draw call.</ScrollIntro>
      <section ref={section} className="relative h-screen">
        <Scene className="absolute inset-0" customCamera>
          <World progress={progress} />
        </Scene>
      </section>
      <ScrollOutro />
    </>
  );
}
