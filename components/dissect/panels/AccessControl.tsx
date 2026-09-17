"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const STATIONS = ["card", "rfid antenna", "rp2040", "relay", "strike"];

export default function AccessControl({ progress, commit, onReady }: { progress: number; commit?: (n: number) => void; onReady?: (r: boolean) => void }) {
  useEffect(() => { onReady?.(scansDone.current); });
  const scansDone = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastIdx = useRef(-1);
  const [flashedIdx, setFlashedIdx] = useState(-1);

  useEffect(() => {
    if (!cardRef.current) return;
    // travel from -5% (just left of first station) to ~105% (past strike)
    const parentW = cardRef.current.parentElement?.clientWidth ?? 1200;
    const x = -60 + progress * (parentW + 120);
    gsap.set(cardRef.current, { x, ease: "power4.out" });
    const idx = Math.min(STATIONS.length - 1, Math.floor(progress * STATIONS.length));
    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      setFlashedIdx(idx);
      setTimeout(() => setFlashedIdx(-1), 220);
      if (idx === STATIONS.length - 1 && !scansDone.current) {
        scansDone.current = true;
        commit?.(1);
      }
    }
  }, [progress]);

  // tap the card to jump it forward — helps when gating makes scroll feel stuck
  const tapCard = () => {
    const next = Math.min(1, progress + 0.18);
    if (!cardRef.current) return;
    const parentW = cardRef.current.parentElement?.clientWidth ?? 1200;
    gsap.set(cardRef.current, { x: -60 + next * (parentW + 120) });
  };

  return (
    <div className="relative flex h-full w-full flex-col justify-between p-12">
      <div className="stage-label"><span>T-003</span><span>/</span><span>access control</span><span className="hr" /><span className="opacity-50">horizontal axis</span></div>

      <div className="relative my-12 flex-1">
        {/* the wire */}
        <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: "rgba(237,240,232,0.2)" }} />
        {/* stations */}
        {STATIONS.map((s, i) => (
          <div key={s} className="absolute top-1/2 -translate-y-1/2 text-center" style={{ left: `${5 + i * 21}%` }}>
            <svg width="64" height="52" viewBox="0 0 64 52" className="mx-auto">
              <rect x="4" y="8" width="56" height="36" fill="none" stroke={flashedIdx === i ? "#2DD4BF" : "rgba(237,240,232,0.5)"} strokeWidth="1" />
              {i === 1 && <><circle cx="32" cy="26" r="9" fill="none" stroke={flashedIdx === i ? "#2DD4BF" : "rgba(237,240,232,0.5)"} strokeWidth="1"/><circle cx="32" cy="26" r="2" fill={flashedIdx === i ? "#2DD4BF" : "rgba(237,240,232,0.5)"} /></>}
              {i === 4 && <rect x="28" y="20" width="8" height="12" fill={progress > 0.95 ? "#2DD4BF" : "none"} stroke={flashedIdx === i ? "#2DD4BF" : "rgba(237,240,232,0.5)"} strokeWidth="1" />}
            </svg>
            <div className="mono-xs mt-2" style={{ fontSize: 10, opacity: flashedIdx === i ? 1 : 0.5, color: flashedIdx === i ? "#2DD4BF" : "inherit" }}>{s}</div>
          </div>
        ))}

        {/* moving card (tap-to-jump) */}
        <div ref={cardRef} className="absolute top-1/2 z-10 -translate-y-1/2 cursor-pointer" onClick={tapCard} style={{ left: "-4%", willChange: "transform" }}>
          <svg width="44" height="30" viewBox="0 0 44 30"><rect width="44" height="30" rx="3" fill="#2DD4BF"/><text x="8" y="20" fontFamily="monospace" fontSize="10" fill="#0B0C09">ID</text></svg>
        </div>

        {/* task banner */}
        {!scansDone.current && (
          <div className="absolute left-1/2 bottom-4 -translate-x-1/2 mono-xs text-center"
            style={{ color: "var(--color-ink)", background: "#2DD4BF", padding: "6px 14px", letterSpacing: "0.18em", fontSize: 10 }}>
            TASK — scroll the card all the way right, past the strike
          </div>
        )}

        {/* title */}
        <div className="display-c absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(2.4rem, 6vw, 5.5rem)", opacity: 0.12 }}>
          access control
        </div>
      </div>

      <div className="flex justify-between">
        <div className="mono-xs opacity-50">{scansDone.current ? "swiped ✓ — gate open" : progress < 1 ? "swiping ▸" : "door open ✓"}</div>
        <div className="mono-xs opacity-50" style={{ color: progress > 0.95 ? "#2DD4BF" : "inherit" }}>{progress > 0.95 ? "door open" : `${Math.round(progress * 100)}%`}</div>
      </div>
    </div>
  );
}
