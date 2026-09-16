"use client";

import { useRef, useState } from "react";
import gsap from "gsap";

type Tray = { id: string; label: string; spec: string; service: string };
const TRAYS: Tray[] = [
  { id: "node-01", label: "node-01 · gpu", spec: "2× gpu · 48 core", service: "llm inference · build runner" },
  { id: "node-02", label: "node-02 · cpu", spec: "24 core", service: "ci · spiders · this portfolio's previous home" },
  { id: "nas",     label: "nas",          spec: "36tb raid-z2",   service: "media · backups" },
  { id: "net",     label: "net",          spec: "10g sfp+",        service: "wireguard gateway" },
];

export default function Homelab({ progress }: { progress: number }) {
  const [openCount, setOpenCount] = useState(0);
  const dragState = useRef<{ tray: string | null; startX: number; trayStartX: number }>({ tray: null, startX: 0, trayStartX: 0 });
  const trayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const openSet = useRef<Set<string>>(new Set());

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
    if (open && !openSet.current.has(id)) { openSet.current.add(id); setOpenCount(openSet.current.size); }
    if (!open) openSet.current.delete(id);
    gsap.to(trayRefs.current[id]!, { x: open ? 160 : 0, duration: 0.35, ease: "power4.out" });
    dragState.current = { tray: null, startX: 0, trayStartX: 0 };
    setOpenCount(openSet.current.size);
  };

  return (
    <div className="flex h-full w-full flex-col justify-between p-12">
      <div className="stage-label"><span>T-006</span><span>/</span><span>homelab</span><span className="hr" /><span className="opacity-50">drag axis</span></div>

      <div className="grid flex-1 gap-10 md:grid-cols-[320px_1fr] items-center">
        {/* rack */}
        <div className="relative h-[420px] border border-paper/18 p-3" style={{ opacity: 0.45 + progress * 0.55 }}>
          <div className="mono-xs opacity-60 mb-3">rack — 4 trays</div>
          {TRAYS.map((t) => (
            <div key={t.id} className="relative mb-3">
              <div className="h-[74px] border border-paper/22 bg-black/20 flex items-center justify-between px-3">
                <div className="mono-xs">{t.label}</div>
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
        <div className="mono-xs opacity-50">{openCount === 0 ? "drag to pull tray" : `devices live: ${openCount} / 4`}</div>
        <div className="mono-xs opacity-50">{Math.round(progress * 100)}%</div>
      </div>
    </div>
  );
}
