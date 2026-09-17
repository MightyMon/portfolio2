"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { latestArtifact, onArtifact, stashArtifact, blip, handoff } from "@/lib/session";
import type { Artifact } from "@/lib/session";

function gauss(x: number, mu = 0, s = 1, a = 1) { return a * Math.exp(-((x - mu) ** 2) / (2 * s * s)); }

function Scene({ progress, exhaleCount }: { progress: number; exhaleCount: number }) {
  const camRef = useRef<THREE.PerspectiveCamera>(null!);
  const spikeAt = useRef(-1);
  const satellites = useMemo(() => {
    const arr: THREE.Object3D[] = [];
    for (let i = 0; i < 4; i++) { const o = new THREE.Object3D(); o.position.set(i * 1.6 - 2.4, 0, -3); arr.push(o); }
    return arr;
  }, []);
  const scatter = useMemo(() => Array.from({ length: 50 }, (_, i) => ({ x: (Math.random() - 0.5) * 6, y: gauss(Math.random() * 3 - 1.5) + (Math.random() - 0.5) * 0.2, z: -8 })), []);
  // kick whenever exhale increments
  useEffect(() => {
    if (exhaleCount > 0) spikeAt.current = performance.now();
  }, [exhaleCount]);
  useFrame(({ camera, clock }) => {
    const dt = spikeAt.current > 0 ? (performance.now() - spikeAt.current) / 1000 : 99;
    // easing 5-second decay
    const kick = dt < 5 ? Math.pow(Math.max(0, 1 - dt / 5), 2.2) : 0;
    camera.position.z = 6 + progress * 12 - kick * 1.8;
    camera.position.y = kick * (Math.sin(dt * 70) * 0.15);
    camera.lookAt(0, 0, -4);
    satellites.forEach((s, i) => { s.position.y = Math.sin(clock.elapsedTime + i) * 0.15; });
  });
  // gaussian curve — amplitude spikes on exhale
  const pts = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i <= 60; i++) { const x = i / 60 * 6 - 3; arr.push([x, gauss(x), 0]); }
    return arr;
  }, []);
  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    return g;
  }, [pts]);
  // dynamic amplitude (scream on exhale)
  const liveGeo = useRef<THREE.BufferGeometry | null>(null);
  const liveLine = useRef<THREE.Line | null>(null);
  useFrame(({ clock }) => {
    if (!liveLine.current) return;
    const dt = spikeAt.current > 0 ? (performance.now() - spikeAt.current) / 1000 : 99;
    const kick = dt < 5 ? Math.pow(Math.max(0, 1 - dt / 5), 1.5) : 0;
    const amp = 1 + kick * 3.2;
    if (!liveGeo.current) liveGeo.current = new THREE.BufferGeometry();
    const livePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const x = (i / 120) * 6 - 3;
      const noise = kick * (Math.sin(x * 12 + clock.elapsedTime * 20) * 0.05 + (Math.random() - 0.5) * 0.04);
      livePts.push(new THREE.Vector3(x, gauss(x) * amp + noise, 0));
    }
    liveLine.current.geometry.setFromPoints(livePts);
  });
  return (
    <>
      {/* baseline original waveform — faint guide */}
      {/* @ts-expect-error primitive line */}
      <line geometry={lineGeo}><lineBasicMaterial color="#1d6a5f" linewidth={1} transparent opacity={0.7} /></line>
      {/* live spiking waveform */}
      <line ref={(l: any) => { liveLine.current = l; }}><lineBasicMaterial color="#2DD4BF" linewidth={2} /></line>
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

export default function Breathalyzer({ progress, commit, onReady }: { progress: number; commit?: (n: number) => void; onReady?: (r: boolean) => void }) {
  const [exhales, setExhales] = useState(0);
  useEffect(() => { onReady?.(exhales > 0); }, [exhales, onReady]);

  // artifact from sovrego arrives — gates us
  const [policy, setPolicy] = useState<Artifact | null>(null);
  useEffect(() => {
    const existing = latestArtifact("policy");
    if (existing) setPolicy(existing);
    const un = onArtifact((a) => { if (a.kind === "policy") setPolicy(a); });
    return un;
  }, []);

  const doExhale = () => {
    blip(740 + Math.random() * 400, 0.16);
    if (exhales === 0) setTimeout(() => handoff(), 100);
    setExhales((c) => {
      const n = c + 1;
      commit?.(n);
      if (n === 1) {
        stashArtifact({
          kind: "signature",
          label: `breath sig · σ${(0.4 + Math.random() * 0.4).toFixed(2)} · ${policy ? "policy-gated" : "unsigned"}`,
          from: "breathalyzer",
        });
      }
      return n;
    });
  };

  return (
    <div
      className="relative h-full w-full"
      onPointerDown={doExhale}
    >
      <div className="absolute left-1/2 top-16 -translate-x-1/2 z-10 text-center">
        <div className="display-c" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(2.4rem, 6vw, 5rem)" }}>breathalyzer</div>
        <div className="mono-xs mt-2 opacity-60">zoom-out · signal fusion</div>
        {policy && (
          <div className="mono-xs mt-2 text-bright" style={{ fontSize: 11, letterSpacing: "0.15em" }}>
            ◂ fed by sovrego — {policy.label}
          </div>
        )}
      </div>
      <Canvas camera={{ position: [0, 0, 6], fov: 55 }} style={{ position: "absolute", inset: 0 }}>
        <Scene progress={progress} exhaleCount={exhales} />
      </Canvas>
      {/* task banner */}
      {exhales === 0 && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 mono-xs text-center pointer-events-none"
          style={{ color: "var(--color-ink)", background: "#2DD4BF", padding: "8px 16px", letterSpacing: "0.18em", fontSize: 11 }}>
          TASK — tap anywhere to exhale{policy ? " · signed by policy" : ""}
        </div>
      )}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 mono-xs opacity-70 z-10">
        {exhales > 0 ? `sig out ▸ ×${exhales}` : progress < 0.5 ? `pulling back… ${Math.round(progress * 100)}%` : progress < 1 ? "signal fusion engaged · tap anywhere" : "context revealed · tap to exhale"}
      </div>
    </div>
  );
}
