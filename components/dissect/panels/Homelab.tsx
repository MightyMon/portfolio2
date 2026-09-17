"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { latestArtifact, onArtifact, stashArtifact, blip, thunk, handoff } from "@/lib/session";
import type { Artifact } from "@/lib/session";

type Tray = { id: string; label: string; spec: string; service: string };
const TRAYS: Tray[] = [
  { id: "node-01", label: "node-01 · gpu", spec: "2× gpu · 48 core", service: "llm inference · build runner" },
  { id: "node-02", label: "node-02 · cpu", spec: "24 core", service: "ci · spiders · this portfolio's previous home" },
  { id: "nas",     label: "nas",          spec: "36tb raid-z2",   service: "media · backups" },
  { id: "net",     label: "net",          spec: "10g sfp+",        service: "wireguard gateway" },
];

export default function Homelab({ progress, commit, onReady }: { progress: number; commit?: (n: number) => void; onReady?: (r: boolean) => void }) {
  const [openCount, setOpenCount] = useState(0);
  const syncedOnce = useRef(false);
  useEffect(() => {
    onReady?.(openCount >= 4);
    if (openCount >= 4 && !syncedOnce.current) {
      syncedOnce.current = true;
      stashArtifact({
        kind: "sync",
        label: `cluster synced · catalog landed on node-01`,
        from: "homelab",
      });
    }
  }, [openCount, onReady]);
  const dragState = useRef<{ tray: string | null; startX: number; trayStartX: number }>({ tray: null, startX: 0, trayStartX: 0 });
  const trayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const openSet = useRef<Set<string>>(new Set());
  const [catalog, setCatalog] = useState<Artifact | null>(null);
  useEffect(() => {
    const existing = latestArtifact("catalogEntry");
    if (existing) setCatalog(existing);
    const un = onArtifact((a) => { if (a.kind === "catalogEntry") setCatalog(a); });
    return un;
  }, []);

  const setTrayX = (id: string, x: number) => {
    const el = trayRefs.current[id];
    if (el) gsap.set(el, { x, duration: 0.2, ease: "power4.out" });
  };

  const onDown = (e: React.PointerEvent, id: string) => {
    dragState.current = { tray: id, startX: e.clientX, trayStartX: gsap.getProperty(trayRefs.current[id]!, "x") as number };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = dragState.current;
    if (!s.tray) return;
    const dx = e.clientX - s.startX;
    const x = Math.min(160, Math.max(0, s.trayStartX + dx));
    setTrayX(s.tray, x);
  };
  const onUp = (e: React.PointerEvent, id: string) => {
    const s = dragState.current;
    if (!s.tray) return;
    const x = gsap.getProperty(trayRefs.current[id]!, "x") as number;
    const open = x > 70;
    if (open && !openSet.current.has(id)) {
      openSet.current.add(id);
      setOpenCount(openSet.current.size);
      commit?.(openSet.current.size);
      blip(880 + openSet.current.size * 110, 0.1);
      if (openSet.current.size === 4) {
        setTimeout(() => thunk(), 80);
        setTimeout(() => handoff(), 350);
      }
      // spring snap + haptic
      gsap.fromTo(trayRefs.current[id]!, { x: x + 12 }, { x: 160, duration: 0.4, ease: "elastic.out(1, 0.4)" });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(12); } catch {}
      }
      const timer = setTimeout(() => {
        // blink the LED on the newly docked tray
        setLedBlink((m) => ({ ...m, [id]: true }));
        setTimeout(() => setLedBlink((m) => ({ ...m, [id]: false })), 800);
      }, 350);
      return () => clearTimeout(timer);
    }
    if (!open) openSet.current.delete(id);
    gsap.to(trayRefs.current[id]!, { x: open ? 160 : 0, duration: 0.35, ease: "power4.out" });
    dragState.current = { tray: null, startX: 0, trayStartX: 0 };
    setOpenCount(openSet.current.size);
  };
  const [ledBlink, setLedBlink] = useState<Record<string, boolean>>({});

  return (
    <div className="flex h-full w-full flex-col justify-between p-12 relative">
      <div className="stage-label"><span>T-006</span><span>/</span><span>homelab</span><span className="hr" /><span className="opacity-50">drag axis</span></div>
      {catalog && (
        <div className="mono-xs mt-2 text-bright" style={{ fontSize: 11, letterSpacing: "0.12em" }}>
          ◂ fed by exosky — {catalog.label} · landing on node-01
        </div>
      )}

      <div className="grid flex-1 gap-10 md:grid-cols-[320px_1fr] items-center">
        {/* rack */}
        <div className="relative h-[420px] border border-paper/18 p-3" style={{ opacity: 0.45 + progress * 0.55 }}>
          <div className="mono-xs opacity-60 mb-3">rack — 4 trays</div>
          {TRAYS.map((t) => (
            <div key={t.id} className="relative mb-3">
              <div className="h-[74px] border border-paper/22 bg-black/20 flex items-center justify-between px-3">
                <div className="mono-xs flex items-center gap-2">
                  {/* status LED */}
                  <div
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{
                      background: ledBlink[t.id] ? "#2DD4BF" : openSet.current.has(t.id) ? "#2DD4BF" : "rgba(237,240,232,0.25)",
                      boxShadow: openSet.current.has(t.id) ? "0 0 8px rgba(45,212,191,0.9)" : "none",
                      animation: ledBlink[t.id] ? "ledBlink 100ms steps(2) 4" : undefined,
                    }}
                  />
                  {t.label}
                </div>
                <div
                  ref={(el) => { trayRefs.current[t.id] = el; }}
                  onPointerDown={(e) => onDown(e, t.id)}
                  onPointerMove={onMove}
                  onPointerUp={(e) => onUp(e, t.id)}
                  className="h-10 w-16 cursor-grab touch-none bg-bright/30 border border-bright"
                  style={{ willChange: "transform" }}
                />
              </div>
            </div>
          ))}
          <div className="mono-xs opacity-45 mt-4">drag handle → slide right</div>
        </div>

        {/* details */}
        <div className="space-y-4">
          {TRAYS.map((t) => {
            const open = openSet.current.has(t.id);
            return (
              <div key={t.id} className="mono-xs transition-opacity" style={{ opacity: open ? 1 : 0.18 }}>
                <div className="text-bright">{t.label} {open ? "· live" : ""}</div>
                <div className="opacity-80">{t.spec}</div>
                <div className="opacity-60 lowercase">{t.service}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <div className="mono-xs opacity-50">{openCount === 0 ? "drag to pull tray" : openCount >= 4 ? `all 4 docked ✓ — gate open` : `devices live: ${openCount} / 4`}</div>
        <div className="mono-xs opacity-50">{Math.round(progress * 100)}%</div>
      </div>

      {/* task banner */}
      {openCount < 4 && (
        <div className="absolute left-1/2 bottom-24 -translate-x-1/2 mono-xs text-center"
          style={{ color: "var(--color-ink)", background: "#2DD4BF", padding: "6px 14px", letterSpacing: "0.18em", fontSize: 10 }}>
          TASK — drag all 4 handles right to dock all trays ({openCount}/4)
        </div>
      )}

      <style>{`
        @keyframes ledBlink { 50% { opacity: 0.3 } }
      `}</style>
    </div>
  );
}
