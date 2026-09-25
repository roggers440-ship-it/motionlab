'use client';
// WebGPURenderer + TSL (Three Shading Language). The node graph below compiles
// to WGSL on WebGPU or GLSL on the WebGL2 fallback — same source.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';
import { color, mix, normalLocal, positionLocal, sin, uniform, uv, vec3 } from 'three/tsl';
import { useControlRef } from '@/store/playground';
import { useInView } from '@/hooks/useInView';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function WebGPUTSL() {
  const wrap = useRef<HTMLDivElement>(null);
  const [backend, setBackend] = useState('initialising…');
  const speed = useControlRef('speed', 1);
  const scale = useControlRef('scale', 6);
  const inView = useInView(wrap);
  const reduced = useReducedMotion();
  const live = useRef({ inView, reduced });
  live.current = { inView, reduced };

  useEffect(() => {
    const el = wrap.current!;
    let disposed = false;
    const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.className = 'absolute inset-0 h-full w-full';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    // --- TSL uniforms & node graph ---
    const uSpeed = uniform(1);
    const uScale = uniform(6);
    const uTime = uniform(0); // own clock (not TSL `time`) so reduced motion can freeze it
    const t = uTime.mul(uSpeed);
    const wave = sin(uv().x.mul(uScale).add(t)).mul(sin(uv().y.mul(uScale).sub(t.mul(0.7)))).mul(0.5).add(0.5);
    const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.3, metalness: 0.2 });
    mat.colorNode = mix(color('#2b3cff'), color('#ff6ec7'), wave);
    mat.emissiveNode = mix(vec3(0, 0, 0), color('#ff6ec7'), wave.pow(4)).mul(0.6);
    mat.positionNode = positionLocal.add(normalLocal.mul(wave.mul(0.12)));

    const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1.1, 0.38, 256, 48), mat);
    scene.add(mesh);
    scene.add(new THREE.HemisphereLight('#ffffff', '#221144', 2));
    const dl = new THREE.DirectionalLight('#ffffff', 2.5);
    dl.position.set(3, 4, 5);
    scene.add(dl);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const timer = new THREE.Timer();
    renderer.init().then(() => {
      if (disposed) return;
      const isGPU = (renderer.backend as unknown as { isWebGPUBackend?: boolean }).isWebGPUBackend;
      setBackend(isGPU ? 'WebGPU (WGSL)' : 'WebGL2 fallback (GLSL)');
      resize();
      renderer.setAnimationLoop(() => {
        timer.update();
        const dt = timer.getDelta();
        if (!live.current.inView) return;
        uSpeed.value = speed.current;
        uScale.value = scale.current;
        if (!live.current.reduced) {
          uTime.value += dt;
          mesh.rotation.y += dt * 0.3;
          mesh.rotation.x += dt * 0.1;
        }
        renderer.render(scene, camera);
      });
    });

    return () => {
      disposed = true;
      ro.disconnect();
      renderer.setAnimationLoop(null);
      mesh.geometry.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [speed, scale]);

  return (
    <div ref={wrap} className="relative h-full">
      <div className="pointer-events-none absolute left-6 top-6 z-30 space-y-2">
        <span className="chip !border-[var(--cat)] !text-fg">Backend: {backend}</span>
        <p className="eyebrow">Colour, emissive and vertex offset are TSL node graphs</p>
      </div>
    </div>
  );
}
