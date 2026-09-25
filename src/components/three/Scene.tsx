'use client';
// A 3D viewport that lives in normal DOM layout but renders through the shared
// canvas. Bridges React context (Playground store, etc.) across the tunnel,
// registers itself so the canvas only loops while scenes exist, and sets up a
// per-view camera.
import { View, PerspectiveCamera } from '@react-three/drei';
import { useContextBridge } from 'its-fine';
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type * as THREE from 'three';
import { useUI } from '@/store/ui';

type Props = {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  camera?: { position?: [number, number, number]; fov?: number; target?: [number, number, number] };
  /** Custom camera inside children instead of the default one */
  customCamera?: boolean;
};

export function Scene({ className, style, children, camera, customCamera }: Props) {
  const Bridge = useContextBridge();
  const addView = useUI((s) => s.addView);
  useEffect(() => {
    addView(1);
    return () => addView(-1);
  }, [addView]);

  return (
    <View className={className} style={style}>
      <Bridge>
        {!customCamera && <DefaultCamera {...camera} />}
        {children}
      </Bridge>
    </View>
  );
}

function DefaultCamera({ position = [0, 0, 5], fov = 45, target = [0, 0, 0] }: NonNullable<Props['camera']>) {
  const ref = useRef<THREE.PerspectiveCamera>(null);
  useLayoutEffect(() => {
    ref.current?.lookAt(...target);
  }, [target]);
  return <PerspectiveCamera ref={ref} makeDefault position={position} fov={fov} />;
}
