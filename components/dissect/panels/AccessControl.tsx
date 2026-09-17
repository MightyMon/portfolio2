"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { latestArtifact, onArtifact, stashArtifact, thunk, handoff } from "@/lib/session";
import type { Artifact } from "@/lib/session";

const STATIONS = ["card", "rfid antenna", "rp2040", "relay", "strike"];

export default function AccessControl({ progress, commit, onReady }: { progress: number; commit?: (n: number) => void; onReady?: (r: boolean) => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ dragging: boolean; startX: number; cardStartX: number }>({ dragging: false, startX: 0, cardStartX: 0 });
  const cardX = useRef(0);
  const unlocked = useRef(false);
  const [unlockedVis, setUnlockedVis] = useState(false);
  const [flash, setFlash] = useState(false);
  const [nearRp2040, setNearRp2040] = useState(false);
  const [signature, setSignature] = useState<Artifact | null>(null);

  useEffect(() => {
    const existing = latestArtifact("signature");
    if (existing) setSignature(existing);
    const un = onArtifact((a) => { if (a.kind === "signature") setSignature(a); });
    return un;
  }, []);

  // ready as soon as unlocked
  useEffect(() => { onReady?.(unlockedVis); }, [unlockedVis, onReady]);

  // rp2040 sits at station index 2 of 5 → x at 5% + 2*21% of track width
  const rp2040X = () => {
    const parentW = trackRef.current?.clientWidth ?? 1200;
    return parentW * (0.05 + 2 * 0.21) - 20; // card center roughly on station
  };

  const onDown = (e: React.PointerEvent) => {
    if (unlocked.current) return;
    dragState.current = { dragging: true, startX: e.clientX, cardStartX: cardX.current };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = dragState.current;
    if (!s.dragging || unlocked.current) return;
    const parentW = trackRef.current?.clientWidth ?? 1200;
    let x = Math.max(0, Math.min(parentW * 0.495, s.cardStartX + (e.clientX - s.startX)));
    cardX.current = x;
    gsap.set(cardRef.current, { x });
    // proximity glow at rp2040
    setNearRp2040(Math.abs(x - rp2040X()) < 60);
  };
  const onUp = () => {
    const s = dragState.current;
    if (!s.dragging || unlocked.current) return;
    s.dragging = false;
    const targetX = rp2040X();
    if (Math.abs(cardX.current - targetX) < 60) {
      // SNAP to rp2040 and unlock
      cardX.current = targetX;
      gsap.to(cardRef.current, { x: targetX, duration: 0.25, ease: "back.out(2.5)" });
      doUnlock();
    } else {
      // spring back to start
      gsap.to(cardRef.current, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      cardX.current = 0;
      setNearRp2040(false);
    }
  };

  const doUnlock = () => {
    if (unlocked.current) return;
    unlocked.current = true;
    setUnlockedVis(true);
    commit?.(1);
    thunk();
    setTimeout(() => handoff(), 180);
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { (navigator as any).vibrate?.([20, 30, 40]); } catch {}
    }
    stashArtifact({
      kind: "doorOpen",
      label: `door 03 unlocked · sig ${signature ? "verified" : "missing"}`,
      from: "access-control",
    });
    // card slides on through to the strike after unlock
    setTimeout(() => {
      const parentW = trackRef.current?.clientWidth ?? 1200;
      cardX.current = parentW * 0.495;
      gsap.to(cardRef.current, { x: cardX.current, duration: 0.8, ease: "power2.inOut" });
    }, 500);
  };

  return (
    <div className="relative flex h-full w-full flex-col justify-between p-12">
      <div className="stage-label"><span>T-003</span><span>/</span><span>access control</span><span className="hr" /><span className="opacity-50">drag axis</span></div>

      <div ref={trackRef} className="relative my-12 flex-1">
        {/* the wire */}
        <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: "rgba(237,240,232,0.2)" }} />
        {/* stations */}
        {STATIONS.map((s, i) => (
          <div key={s} className="absolute top-1/2 -translate-y-1/2 text-center" style={{ left: `${5 + i * 21}%` }}>
            <svg width="64" height="52" viewBox="0 0 64 52" className="mx-auto">
              <rect x="4" y="8" width="56" height="36" fill="none"
                stroke={i === 2 && nearRp2040 ? "#2DD4BF" : unlockedVis && i >= 2 ? "#2DD4BF" : "rgba(237,240,232,0.5)"}
                strokeWidth={i === 2 && nearRp2040 ? "2" : "1"} />
              {i === 1 && <><circle cx="32" cy="26" r="9" fill="none" stroke="rgba(237,240,232,0.5)" strokeWidth="1"/><circle cx="32" cy="26" r="2" fill="rgba(237,240,232,0.5)" /></>}
              {/* rp2040: chip with a little LED that lights when card is near */}
              {i === 2 && <circle cx="52" cy="14" r="3" fill={nearRp2040 || unlockedVis ? "#2DD4BF" : "rgba(237,240,232,0.3)"} />}
              {i === 4 && <rect x="28" y="20" width="8" height="12" fill={unlockedVis ? "#2DD4BF" : "none"} stroke="rgba(237,240,232,0.5)" strokeWidth="1" />}
            </svg>
            <div className="mono-xs mt-2" style={{ fontSize: 10, opacity: (i === 2 && nearRp2040) || unlockedVis ? 1 : 0.5, color: (i === 2 && nearRp2040) ? "#2DD4BF" : "inherit" }}>{s}</div>
          </div>
        ))}

        {/* draggable card */}
        <div
          ref={cardRef}
          className="absolute top-1/2 z-10 -translate-y-1/2 touch-none select-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{ left: "5%", cursor: unlockedVis ? "default" : "grab", willChange: "transform" }}
        >
          <svg width="72" height="48" viewBox="0 0 72 48" style={{ filter: "drop-shadow(0 4px 12px rgba(45,212,191,0.25))" }}>
            <rect width="72" height="48" rx="4" fill="#2DD4BF"/>
            <text x="10" y="22" fontFamily="monospace" fontSize="11" fill="#0B0C09">ID</text>
            {/* chip */}
            <rect x="10" y="28" width="14" height="10" rx="1" fill="none" stroke="#0B0C09" strokeWidth="1"/>
            {signature && <circle cx="62" cy="9" r="3" fill="#0B0C09" />}
            {unlockedVis && <text x="30" y="22" fontFamily="monospace" fontSize="9" fill="#0B0C09">✓</text>}
          </svg>
          {/* drag hint */}
          {!unlockedVis && (
            <div className="mono-xs absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-60" style={{ fontSize: 10, letterSpacing: "0.1em" }}>
              {nearRp2040 ? "release to unlock" : "◂ drag ▸"}
            </div>
          )}
        </div>

        {/* task banner */}
        {!unlockedVis && (
          <div className="absolute left-1/2 bottom-4 -translate-x-1/2 mono-xs text-center pointer-events-none"
            style={{ color: "var(--color-ink)", background: "#2DD4BF", padding: "6px 14px", letterSpacing: "0.18em", fontSize: 10 }}>
            TASK — drag the card onto the rp2040 to unlock
          </div>
        )}

        {/* title */}
        <div className="display-c absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(2.4rem, 6vw, 5.5rem)", opacity: 0.12 }}>
          access control
        </div>

        {/* unlock flash at strike */}
        {flash && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none z-30"
            style={{ background: "radial-gradient(circle at right, rgba(45,212,191,0.85), transparent 60%)", animation: "flash 700ms" }} />
        )}
        <style>{`@keyframes flash { 0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 0; } }`}</style>
      </div>

      <div className="flex justify-between">
        <div className="mono-xs opacity-50">{unlockedVis ? "door open ✓ — gate open" : nearRp2040 ? "release ▸" : "drag the card onto the rp2040"}</div>
        <div className="mono-xs opacity-50" style={{ color: unlockedVis ? "#2DD4BF" : "inherit" }}>{unlockedVis ? "unlocked" : "locked"}</div>
      </div>
    </div>
  );
}
