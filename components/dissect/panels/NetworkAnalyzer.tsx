"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, useEffect, useState } from "react";
import { latestArtifact, onArtifact, stashArtifact } from "@/lib/session";
import type { Artifact } from "@/lib/session";

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

export default function NetworkAnalyzer({ progress, commit, onReady }: { progress: number; commit?: (n: number) => void; onReady?: (r: boolean) => void }) {
  useEffect(() => { onReady?.(traced.current); });
  const traced = useRef(false);
  const [doorOpen, setDoorOpen] = useState<Artifact | null>(null);
  useEffect(() => {
    const existing = latestArtifact("doorOpen");
    if (existing) setDoorOpen(existing);
    const un = onArtifact((a) => { if (a.kind === "doorOpen") setDoorOpen(a); });
    return un;
  }, []);
  useEffect(() => {
    if (progress > 0.7 && !traced.current) {
      traced.current = true;
      commit?.(1);
      stashArtifact({
        kind: "pcap",
        label: `route traced · 36 nodes · ${doorOpen ? "door packet found" : "no door traffic"}`,
        from: "network-analyzer",
      });
    }
  }, [progress, commit, doorOpen]);
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-1/2 top-16 -translate-x-1/2 z-10 text-center">
        <div className="display-c" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(2.4rem, 6vw, 5rem)" }}>network analyzer</div>
        <div className="mono-xs mt-2 opacity-60">orbit · pcap → graph</div>
        {doorOpen && (
          <div className="mono-xs mt-2 text-bright" style={{ fontSize: 11, letterSpacing: "0.15em" }}>
            ◂ fed by access — {doorOpen.label}
          </div>
        )}
      </div>
      <Canvas camera={{ position: [0, 4.5, 14], fov: 55 }} style={{ position: "absolute", inset: 0 }}>
        <Orbiter progress={progress} />
        <Topology />
      </Canvas>
      {!traced.current && (
        <div className="absolute left-1/2 bottom-24 -translate-x-1/2 z-10 mono-xs text-center pointer-events-none"
          style={{ color: "var(--color-ink)", background: "#2DD4BF", padding: "6px 14px", letterSpacing: "0.18em", fontSize: 10 }}>
          TASK — keep scrolling until the orbit passes 70%
        </div>
      )}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 mono-xs opacity-70">
        {traced.current ? "route traced ✓ — gate open" : `orbiting · ${Math.round(progress * 360)}°`}
      </div>
    </div>
  );
}
