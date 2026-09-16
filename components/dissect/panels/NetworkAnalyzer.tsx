"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";

type GraphNode = { pos: [number, number, number]; isRing: boolean; parent?: number };

function Topology() {
  const nodes = useMemo<GraphNode[]>(() => {
    const arr: GraphNode[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      arr.push({ pos: [Math.cos(a) * 6, 0, Math.sin(a) * 6], isRing: true });
    }
    for (let i = 0; i < 24; i++) {
      const p = Math.floor(i / 2);
      const a = (p / 12) * Math.PI * 2 + (i % 2 === 0 ? 0.3 : -0.3);
      const r = 8 + Math.random() * 2.5;
      arr.push({ pos: [Math.cos(a) * r, (Math.random() - 0.5) * 1.4, Math.sin(a) * r], isRing: false, parent: p });
    }
    return arr;
  }, []);

  const lineGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 12; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.parent !== undefined) {
        pts.push(new THREE.Vector3(...nodes[n.parent].pos));
        pts.push(new THREE.Vector3(...n.pos));
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [nodes]);

  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({ color: 0xedf0e8, transparent: true, opacity: 0.2 }), []);
  const lineObject = useMemo(() => new THREE.LineSegments(lineGeo, lineMaterial), [lineGeo, lineMaterial]);
  const hotOne = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (hotOne.current) {
      hotOne.current.rotation.y = clock.elapsedTime;
      hotOne.current.rotation.x = clock.elapsedTime * 1.4;
    }
  });
  return (
    <>
      {nodes.map((n, i) => (
        <mesh key={i} position={n.pos} ref={i === 12 ? hotOne : undefined}>
          <sphereGeometry args={[n.isRing ? 0.22 : 0.11, 10, 10]} />
          <meshBasicMaterial color={i === 12 ? "#2DD4BF" : "#EDF0E8"} wireframe={i === 12} />
        </mesh>
      ))}
      <primitive object={lineObject} />
    </>
  );
}

function Orbiter({ progress }: { progress: number }) {
  useFrame(({ camera }) => {
    const a = progress * Math.PI * 2;
    camera.position.set(Math.sin(a) * 14, 4.5, Math.cos(a) * 14);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function NetworkAnalyzer({ progress, commit }: { progress: number; commit?: (n: number) => void }) {
  const traced = useRef(false);
  useEffect(() => { if (progress > 0.7 && !traced.current) { traced.current = true; commit?.(1); } }, [progress, commit]);
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-1/2 top-16 -translate-x-1/2 z-10 text-center">
        <div className="display-c" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(2.4rem, 6vw, 5rem)" }}>network analyzer</div>
        <div className="mono-xs mt-2 opacity-60">orbit · pcap → graph</div>
      </div>
      <Canvas camera={{ position: [0, 4.5, 14], fov: 55 }} style={{ position: "absolute", inset: 0 }}>
        <Orbiter progress={progress} />
        <Topology />
      </Canvas>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 mono-xs opacity-70">
        {progress < 0.3 ? `orbiting · ${Math.round(progress * 360)}°` : progress < 1 ? `orbiting · ${Math.round(progress * 360)}°` : "topology mapped ✓"}
      </div>
    </div>
  );
}
