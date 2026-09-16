"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { bump, announceStage, setMaxScroll } from "@/lib/session";

const PAYLOADS = [
  "sovrego", "breathalyzer", "access-control", "ccst",
  "cisai", "innspark", "k8s", "rag", "rego", "rp2040",
  "icpc", "exosky", "kerala", "amrita", "vllm", "litellm",
];

type Packet = {
  x: number; y: number; z: number;
  speed: number;
  isAnomaly: boolean;
  glyph: string;
  captured: boolean;
};

function Field({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const COUNT = 720;
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const anomalyMesh = useRef<THREE.InstancedMesh>(null!);

  const packets = useMemo<Packet[]>(() => {
    const arr: Packet[] = [];
    for (let i = 0; i < COUNT; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 30,
        z: (Math.random() - 0.5) * 40 - 6,
        speed: 0.02 + Math.random() * 0.06,
        isAnomaly: false,
        glyph: PAYLOADS[Math.floor(Math.random() * PAYLOADS.length)],
        captured: false,
      });
    }
    return arr;
  }, []);

  // anomalies
  const anomalies = useMemo(() => {
    const arr: Packet[] = [];
    for (let i = 0; i < 5; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 30,
        z: (Math.random() - 0.5) * 20 - 4,
        speed: 0.03 + Math.random() * 0.05,
        isAnomaly: true,
        glyph: "ANOMALY",
        captured: false,
      });
    }
    return arr;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    announceStage("BOOT");
  }, []);

  // spawner ticker
  useEffect(() => {
    const t = setInterval(() => {
      const a = anomalies[Math.floor(Math.random() * anomalies.length)];
      if (!a.captured) {
        a.x = (Math.random() - 0.5) * 60;
        a.y = (Math.random() - 0.5) * 30;
        a.captured = false;
        bump("anomalies");
      }
    }, 7000 + Math.random() * 4000);
    return () => clearInterval(t);
  }, [anomalies]);

  const { camera } = useThree();

  useFrame((_, delta) => {
    const p = pointer.current;
    // camera dolly in slowly
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 14, 0.02);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, p.x * 1.6, 0.06);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, p.y * 1.0, 0.06);
    camera.lookAt(0, 0, 0);

    // ordinary packets — flow left→right
    for (let i = 0; i < packets.length; i++) {
      const pk = packets[i];
      pk.x += pk.speed * delta * 60;
      if (pk.x > 34) { pk.x = -34; pk.y = (Math.random() - 0.5) * 30; }
      dummy.position.set(pk.x, pk.y, pk.z);
      // brightness by distance to pointer (world projection approx)
      const dx = pk.x - p.x * 26;
      const dy = pk.y - p.y * 14;
      const d2 = dx * dx + dy * dy;
      const r = 8;
      const boost = Math.max(0, 1 - d2 / (r * r));
      dummy.scale.setScalar(0.06 + boost * 0.09);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
      color.setRGB(0.55 + boost * 0.45, 0.62 + boost * 0.38, 0.58 + boost * 0.35);
      mesh.current.setColorAt(i, color);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;

    // anomaly packets — pulsing accent
    for (let i = 0; i < anomalies.length; i++) {
      const a = anomalies[i];
      a.x += a.speed * delta * 40;
      if (a.x > 34) { a.x = -34; a.y = (Math.random() - 0.5) * 30; a.captured = false; }
      const dx = a.x - p.x * 26;
      const dy = a.y - p.y * 14;
      const d2 = dx * dx + dy * dy;
      const near = d2 < 36;
      if (near && !a.captured) {
        a.captured = true;
        bump("inspected");
      }
      dummy.position.set(a.x, a.y, a.z);
      const pulse = 0.10 + Math.sin(Date.now() / 320 + i) * 0.03;
      dummy.scale.setScalar(pulse * (near ? 2.2 : 1));
      dummy.updateMatrix();
      anomalyMesh.current.setMatrixAt(i, dummy.matrix);
    }
    anomalyMesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group}>
      {/* ambient mote pass */}
      <instancedMesh ref={mesh} args={[undefined, undefined, packets.length]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={anomalyMesh} args={[undefined, undefined, anomalies.length]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#2DD4BF" toneMapped={false} wireframe />
      </instancedMesh>
    </group>
  );
}

function Rig({ frozen = false }: { frozen?: boolean }) {
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (frozen) return; // skip all listeners on mobile
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    // packet counter ticker (slow, ambient)
    const t = setInterval(() => bump("packets", 3 + Math.floor(Math.random() * 7)), 1200);
    const onScroll = () => {
      const h = document.documentElement;
      const pct = Math.round((h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100) || 0;
      setMaxScroll(pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      clearInterval(t);
    };
  }, [frozen]);
  return <Field pointer={pointer} />;
}

export default function TownField() {
  const [opacity, setOpacity] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
    }
    const onScroll = () => {
      // dim the field as the visitor leaves hero
      const v = Math.max(0.1, 1 - window.scrollY / (window.innerHeight * 0.9));
      setOpacity(v);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Don't unmount Canvas — React + R3F teardown is fragile on mobile and triggers
  // removeChild hydration errors. Hide + pause rendering instead: keeps tree intact.
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        opacity,
        transition: "opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: "none",
        visibility: isMobile ? "hidden" : "visible",
      }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 26], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop={isMobile ? "never" : "always"}
      >
        <Rig frozen={isMobile} />
      </Canvas>
    </div>
  );
}
