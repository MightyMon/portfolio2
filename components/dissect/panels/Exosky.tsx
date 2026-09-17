"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { latestArtifact, onArtifact, stashArtifact, thunk, handoff } from "@/lib/session";
import type { Artifact } from "@/lib/session";

const STARS = 800;

type StarData = { pos: THREE.Vector3; mag: number; id: string };

function makeStars(): StarData[] {
  const arr: StarData[] = [];
  for (let i = 0; i < STARS; i++) {
    const r = 30;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    arr.push({
      pos: new THREE.Vector3(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)),
      mag: Math.random(),
      id: `0x${Math.floor(Math.random() * 0xfff).toString(16).padStart(3, "0")}`,
    });
  }
  return arr;
}

function Stars({ stars }: { stars: StarData[] }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setFromPoints(stars.map((s) => s.pos));
    return g;
  }, [stars]);
  const mat = useMemo(
    () => new THREE.PointsMaterial({ color: 0xedf0e8, size: 0.1, sizeAttenuation: true, transparent: true, opacity: 0.85 }),
    []
  );
  return <points geometry={geo} material={mat} />;
}

// green-teal target star that we lock onto late in the sequence
function Target({ locked, onLock }: { locked: boolean; onLock: () => void }) {
  const ring = useRef<THREE.Group>(null!);
  const sphere = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ring.current) {
      const pulse = locked ? 1 + Math.sin(clock.elapsedTime * 5) * 0.05 : 1 + Math.sin(clock.elapsedTime * 1.2) * 0.08;
      ring.current.scale.setScalar(pulse);
      ring.current.rotation.z = clock.elapsedTime * (locked ? 0.3 : 0.12);
    }
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh ref={sphere}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial color="#2DD4BF" wireframe />
      </mesh>
      <group ref={ring}>
        <mesh><ringGeometry args={[0.95, 1.0, 48]} /><meshBasicMaterial color="#2DD4BF" side={THREE.DoubleSide} transparent opacity={0.9} /></mesh>
        <mesh><ringGeometry args={[1.35, 1.37, 48]} /><meshBasicMaterial color="#2DD4BF" side={THREE.DoubleSide} transparent opacity={0.45} /></mesh>
      </group>
    </group>
  );
}

// scan band for phase 0 — a thin bar crossing the starfield
function ScanBand({ progress }: { progress: number }) {
  const band = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (band.current) {
      band.current.position.y = -12 + progress * 24;
    }
  });
  return (
    <mesh ref={band}>
      <planeGeometry args={[60, 0.04]} />
      <meshBasicMaterial color="#2DD4BF" transparent opacity={progress < 0.3 ? 0.7 : 0} />
    </mesh>
  );
}

function CameraRig({ progress, pointer }: { progress: number; pointer: React.RefObject<{x: number, y: number}> }) {
  useFrame(({ camera, clock }) => {
    // phases:
    // 0-0.3 scan: cam starts z=42, slow sidetrack
    // 0.3-0.7 acquisition: cam tracks pointer via cone
    // 0.7-1 lock: cam pushes in to target
    if (progress < 0.3) {
      const t = progress / 0.3;
      camera.position.z = 42;
      camera.position.x = -6 + t * 12;
      camera.position.y = (t - 0.5) * 2;
      camera.lookAt(0, 0, 0);
    } else if (progress < 0.7) {
      const p = pointer.current!;
      camera.position.z = 38;
      camera.position.x = p.x * 8;
      camera.position.y = p.y * 5;
      camera.lookAt(0, 0, 0);
    } else {
      const t = (progress - 0.7) / 0.3;
      camera.position.z = 38 - t * 33;
      camera.position.x = Math.sin(clock.elapsedTime * 0.1) * 0.4 * (1 - t);
      camera.position.y = (1 - t) * 1;
      camera.lookAt(0, 0, 0);
    }
  });
  return null;
}

export default function Exosky({ progress, commit, onReady }: { progress: number; commit?: (n: number) => void; onReady?: (r: boolean) => void }) {
  useEffect(() => { onReady?.(lockedOnce.current); });
  const lockedOnce = useRef(false);
  const [pcap, setPcap] = useState<Artifact | null>(null);
  useEffect(() => {
    const existing = latestArtifact("pcap");
    if (existing) setPcap(existing);
    const un = onArtifact((a) => { if (a.kind === "pcap") setPcap(a); });
    return un;
  }, []);
  useEffect(() => {
    if (progress >= 0.7 && !lockedOnce.current) {
      lockedOnce.current = true;
      commit?.(1);
      thunk();
      setTimeout(() => handoff(), 220);
      setJustLocked(true);
      setTimeout(() => setJustLocked(false), 1200);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.([30, 20, 50]); } catch {}
      }
      stashArtifact({
        kind: "catalogEntry",
        label: `k2-18b · 120pc · ${pcap ? "telescope seated via network route" : "default catalog"}`,
        from: "exosky",
      });
    }
  }, [progress, commit, pcap]);
  const stars = useMemo(makeStars, []);
  const pointer = useRef({ x: 0, y: 0 });
  const [logged, setLogged] = useState<string[]>([]);
  const [scan, setScan] = useState(progress < 0.3);
  const [acq, setAcq] = useState(progress >= 0.3 && progress < 0.7);
  const [locked, setLocked] = useState(progress >= 0.7);
  const [justLocked, setJustLocked] = useState(false);

  useEffect(() => {
    setScan(progress < 0.3);
    setAcq(progress >= 0.3 && progress < 0.7);
    setLocked(progress >= 0.7);
    if (progress >= 0.7 && logged.length === 0) {
      // auto-log the locked target
      setLogged(["0x04c — k2-18b · candidate · 120pc"]);
    }
  }, [progress, logged.length]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current = {
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: -(((e.clientY - r.top) / r.height) * 2 - 1),
    };
    // catalog event in acquisition phase — dragging cone across stars
    if (acq) {
      // probabilistic log
      if (Math.random() < 0.0035 && logged.length < 9) {
        const candidate = stars[Math.floor(Math.random() * stars.length)];
        const entry = `#ROI ${candidate.id} · m ${(candidate.mag * 4).toFixed(2)} · candidate`;
        if (!logged.find((l) => l.startsWith(`#ROI ${candidate.id}`))) {
          setLogged((l) => [...l, entry]);
        }
      }
    }
  };

  return (
    <div className="relative h-full w-full" onPointerMove={onMove} style={{ cursor: acq ? "crosshair" : "default" }}>
      <div className="absolute left-1/2 top-16 -translate-x-1/2 z-10 text-center">
        <div className="display-c" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(2.4rem, 6vw, 5rem)" }}>exosky</div>
        <div className="mono-xs mt-2 opacity-60">
          {scan && "phase 1 · scan — transit telescope sweeping south→north"}
          {acq && "phase 2 · acquisition — drag to catalog candidates"}
          {locked && "phase 3 · lock · candidate selected"}
        </div>
        {pcap && (
          <div className="mono-xs mt-2 text-bright" style={{ fontSize: 11, letterSpacing: "0.15em" }}>
            ◂ fed by network — {pcap.label}
          </div>
        )}
      </div>

      <Canvas camera={{ position: [0, 0, 42], fov: 50 }} style={{ position: "absolute", inset: 0 }}>
        <Stars stars={stars} />
        <Target locked={locked} onLock={() => {}} />
        <ScanBand progress={progress < 0.3 ? progress / 0.3 : 1} />
        <CameraRig progress={progress} pointer={pointer} />
      </Canvas>

      {/* task banner */}
      {!lockedOnce.current && (
        <div className="absolute left-1/2 bottom-24 -translate-x-1/2 z-10 mono-xs text-center pointer-events-none"
          style={{ color: "var(--color-ink)", background: "#2DD4BF", padding: "6px 14px", letterSpacing: "0.18em", fontSize: 10 }}>
          TASK — keep scrolling through all 3 phases until target locks
        </div>
      )}

      {/* catalog strip */}
      <div className="absolute bottom-16 right-8 mono-xs text-right" style={{ color: "rgba(237,240,232,0.8)" }}>
        <div className="text-bright" style={{ opacity: 0.85 }}>catalog · {logged.length} logged</div>
        <div style={{ maxHeight: 120, overflow: "hidden", display: "flex", flexDirection: "column", gap: 2 }}>
          {logged.slice(-5).map((l, i) => (
            <div key={l + i} style={{ opacity: 0.7 - i * 0.15 }}>{l}</div>
          ))}
        </div>
      </div>

      {/* cinematic lock-in framing */}
      {justLocked && (
        <>
          <div className="absolute top-0 left-0 right-0 bg-black pointer-events-none z-30" style={{ height: 0, animation: "barDown 600ms ease-out forwards" }} />
          <div className="absolute bottom-0 left-0 right-0 bg-black pointer-events-none z-30" style={{ height: 0, animation: "barUp 600ms ease-out forwards" }} />
        </>
      )}

      {/* status */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 mono-xs opacity-70">
        {scan && `scanning… ${Math.round((progress / 0.3) * 100)}%`}
        {acq && `acquiring… ${Math.round(((progress - 0.3) / 0.4) * 100)}%` + (logged.length > 0 ? ` · ${logged.length} logged` : "")}
        {locked && "target locked ✓ · k2-18b · 120pc · habitable zone candidate"}
      </div>

      <style>{`
        @keyframes barDown { 0% { height: 0 } 100% { height: 48px } 40% { height: 48px } 100% { height: 0 } }
        @keyframes barUp { 0% { height: 0 } 100% { height: 48px } 40% { height: 48px } 100% { height: 0 } }
      `}</style>
    </div>
  );
}
