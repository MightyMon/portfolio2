"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, useState } from "react";

function gauss(x: number, mu = 0, s = 1, a = 1) { return a * Math.exp(-((x - mu) ** 2) / (2 * s * s)); }

function Scene({ progress }: { progress: number }) {
  const camRef = useRef<THREE.PerspectiveCamera>(null!);
  const satellites = useMemo(() => {
    const arr: THREE.Object3D[] = [];
    for (let i = 0; i < 4; i++) { const o = new THREE.Object3D(); o.position.set(i * 1.6 - 2.4, 0, -3); arr.push(o); }
    return arr;
  }, []);
  const scatter = useMemo(() => Array.from({ length: 50 }, (_, i) => ({ x: (Math.random() - 0.5) * 6, y: gauss(Math.random() * 3 - 1.5) + (Math.random() - 0.5) * 0.2, z: -8 })), []);
  useFrame(({ camera, clock }) => {
    camera.position.z = 6 + progress * 12;
    camera.lookAt(0, 0, -4);
    satellites.forEach((s, i) => { s.position.y = Math.sin(clock.elapsedTime + i) * 0.15; });
  });
  // gaussian curve
  const pts = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i <= 60; i++) { const x = i / 60 * 6 - 3; arr.push([x, gauss(x), 0]); }
    return arr;
  }, []);
  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    return g;
  }, [pts]);
  return (
    <>
      {/* waveform */}
      {/* @ts-expect-error primitive line */}
      <line geometry={lineGeo}><lineBasicMaterial color="#2DD4BF" linewidth={2} /></line>
      {/* sensors */}
      {satellites.map((o, i) => (
        <mesh key={i} position={o.position}><sphereGeometry args={[0.13, 12, 12]} /><meshBasicMaterial color="#EDF0E8" /></mesh>
      ))}
      {/* fusion hub */}
      <mesh position={[0, 0, -6]}><sphereGeometry args={[0.32, 16, 16]} /><meshBasicMaterial color="#2DD4BF" /></mesh>
      {/* scatter */}
      {scatter.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]}><sphereGeometry args={[0.05, 8, 8]} /><meshBasicMaterial color="#EDF0E8" opacity={0.55} transparent /></mesh>
      ))}
      <perspectiveCamera ref={camRef} />
    </>
  );
}

export default function Breathalyzer({ progress, commit }: { progress: number; commit?: (n: number) => void }) {
  const [exhales, setExhales] = useState(0);
  return (
    <div
      className="relative h-full w-full"
      onPointerDown={() => { setExhales((c) => { const n = c + 1; commit?.(n); return n; }); }}
    >
      <div className="absolute left-1/2 top-16 -translate-x-1/2 z-10 text-center">
        <div className="display-c" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(2.4rem, 6vw, 5rem)" }}>breathalyzer</div>
        <div className="mono-xs mt-2 opacity-60">zoom-out · signal fusion</div>
      </div>
      <Canvas camera={{ position: [0, 0, 6], fov: 55 }} style={{ position: "absolute", inset: 0 }}>
        <Scene progress={progress} />
      </Canvas>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 mono-xs opacity-70">
        {exhales > 0 ? `exhaled ×${exhales} ✓` : progress < 0.5 ? `pulling back… ${Math.round(progress * 100)}%` : progress < 1 ? "signal fusion engaged · tap to exhale" : "context revealed ✓"}
      </div>
    </div>
  );
}
