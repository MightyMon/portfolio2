"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";

function Stars() {
  const pts = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < 600; i++) {
      const r = 30;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      arr.push([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)]);
    }
    return arr;
  }, []);
  const g = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))), [pts]);
  return (
    <points geometry={g}>
      <pointsMaterial color="#EDF0E8" size={0.08} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}

function Target({ progress }: { progress: number }) {
  const ret = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (ret.current) {
      const locked = progress > 0.7;
      const pulse = locked ? 1 + Math.sin(clock.elapsedTime * 5) * 0.04 : 1;
      ret.current.scale.setScalar(pulse);
      ret.current.rotation.z = locked ? 0 : clock.elapsedTime * 0.3;
    }
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial color="#2DD4BF" wireframe />
      </mesh>
      <group ref={ret}>
        <mesh><ringGeometry args={[0.9, 0.95, 48]} /><meshBasicMaterial color="#2DD4BF" side={THREE.DoubleSide} transparent opacity={0.8} /></mesh>
        <mesh><ringGeometry args={[1.3, 1.32, 48]} /><meshBasicMaterial color="#2DD4BF" side={THREE.DoubleSide} transparent opacity={0.4} /></mesh>
      </group>
    </group>
  );
}

function Zoom({ progress }: { progress: number }) {
  useFrame(({ camera }) => {
    camera.position.z = 40 - progress * 35;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function Exosky({ progress }: { progress: number }) {
  const locked = progress > 0.7;
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-1/2 top-16 -translate-x-1/2 z-10 text-center">
        <div className="display-c" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(2.4rem, 6vw, 5rem)" }}>exosky</div>
        <div className="mono-xs mt-2 opacity-60">zoom-in · space apps 2024</div>
      </div>
      <Canvas camera={{ position: [0, 0, 40], fov: 50 }} style={{ position: "absolute", inset: 0 }}>
        <Stars />
        <Target progress={progress} />
        <Zoom progress={progress} />
      </Canvas>
      {locked && (
        <div className="absolute bottom-16 right-8 mono-xs opacity-90 text-right" style={{ color: "#2DD4BF" }}>
          k2-18b · 120pc<br />habitable zone candidate
        </div>
      )}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 mono-xs opacity-70">
        {progress < 1 ? `focusing… ${Math.round(progress * 100)}%` : "target locked ✓"}
      </div>
    </div>
  );
}
