"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { announceStage, bump } from "@/lib/session";

gsap.registerPlugin(ScrollTrigger);

export type PanelSpec = {
  id: string;
  name: string;
  desc: string;
  axis: string;
  verb: string;
  component: React.ComponentType<{
    progress: number;
    commit?: (earned: number) => void;
    onReady?: (ready: boolean) => void;
  }>;
};

const VERB_OF: Record<string, string> = {
  "sovrego": "compile",
  "breathalyzer": "exhale",
  "access-control": "scan",
  "network-analyzer": "trace route",
  "exosky": "catalog",
  "homelab": "dock",
  "malwareDetection": "scrub",
  "malwareGeneration": "disclose",
  "community": "parade",
  "whiteeye": "survey",
};

export default function Rail({ panels }: { panels: PanelSpec[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [earned, setEarned] = useState<Record<string, number>>({});
  const [readyMap, setReadyMap] = useState<Record<string, boolean>>({});
  const [gateBlocked, setGateBlocked] = useState<string | null>(null);
  // On mobile the rail is display:none but it would still mount all 4 WebGL panels
  // (the "This page cannot be loaded" phone crash). Disable rail entirely on
  // mobile — the mobile-only DOM is the source of truth there.
  const [railEnabled, setRailEnabled] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 768px)");
    const up = () => setRailEnabled(mql.matches);
    up();
    mql.addEventListener("change", up);
    return () => mql.removeEventListener("change", up);
  }, []);

  const commit = (panelId: string, earnedCount: number) => {
    setEarned((e) => ({ ...e, [panelId]: earnedCount }));
    bump("inspected", earnedCount);
  };

  const setReady = (id: string, ready: boolean) => {
    setReadyMap((m) => (m[id] === ready ? m : { ...m, [id]: ready }));
  };

  const panelIndex = Math.min(panels.length - 1, Math.floor(progress * panels.length));
  const panelProgress = (progress * panels.length) % 1;
  const active = panels[panelIndex];
  const activeVerb = VERB_OF[String(active?.id)] || "operate";
  const activeReady = active ? (readyMap[String(active.id)] ?? false) : true;

  // gate forward progression on next panel being ready
  const stRef = useRef<ScrollTrigger | null>(null);
  const clampedProgress = useRef(0);

  useEffect(() => {
    if (!wrapRef.current || !railRef.current) return;
    const rail = railRef.current;
    const travel = rail.scrollWidth - window.innerWidth;

    let stInstance: ScrollTrigger | null = null;
    const st = ScrollTrigger.create({
      trigger: wrapRef.current,
      start: "top top",
      end: () => "+=" + (travel + window.innerHeight * 0.5),
      pin: true,
      scrub: 0.4,
      onUpdate: (self) => {
        // if next panel isn't ready, clamp at boundary
        const rawP = self.progress;
        const rawIdx = Math.min(panels.length - 1, Math.floor(rawP * panels.length));
        // gating: block entering panel i if panel i-1 isn't ready
        if (rawIdx > 0) {
          const prev = panels[rawIdx - 1];
          // blocked if prev panel isn't ready
          const prevReady = readyMap[String(prev.id)] ?? false;
          if (!prevReady && stInstance) {
            const clamp = (rawIdx - 1 + 0.98) / panels.length;
            clampedProgress.current = clamp;
            self.scroll(stInstance.start + (stInstance.end - stInstance.start) * clamp);
            setGateBlocked(String(prev.id));
            return;
          }
        }
        clampedProgress.current = rawP;
        setGateBlocked(null);
        setProgress(rawP);
        announceStage("DISSECT");
      },
    });
    stInstance = st;
    stRef.current = st;

    const raf = () => {
      // if gate blocked, rail holds at clamp position
      const p = clampedProgress.current;
      const x = -travel * p;
      rail.style.transform = `translate3d(${x}px, 0, 0)`;
    };
    const ticker = gsap.ticker.add(raf);
    return () => { st.kill(); gsap.ticker.remove(ticker); };
  }, [panels, readyMap, railEnabled]);

  // On mobile, don't render rail DOM at all — saves 4 WebGL contexts and 800vh of scroll-jacking
  if (!railEnabled) return null;

  const totalEarned = Object.values(earned).reduce((a, b) => a + b, 0);

  return (
    <div ref={wrapRef} className="relative" style={{ height: "100vh" }}>
      <div ref={railRef} className="absolute left-0 top-0 flex" style={{ width: `${panels.length * 100}vw`, willChange: "transform" }}>
        {panels.map((p, i) => {
          const isActive = panelIndex === i;
          return (
            <div key={p.id} className="relative h-screen w-screen flex-none overflow-hidden" data-rail-panel={p.id}>
              <div className="absolute left-6 top-20 z-10 mono-xs opacity-55">{`axis: ${p.axis}`}</div>
              <div className="absolute left-6 top-6 z-10 mono-xs opacity-45">{`T-${String(i + 1).padStart(3, "0")}`}</div>
              {/* lock overlay when panel ahead of this one is blocked */}
              {i > 0 && !((readyMap[String(panels[i-1].id)] ?? false)) && (
                <div className="absolute inset-0 z-30 bg-void/60 backdrop-blur-[2px] grid place-items-center">
                  <div className="mono-xs text-bright" style={{ fontSize: 13, letterSpacing: "0.2em" }}>
                    {panels[i-1].name.toUpperCase()} — verb required · {VERB_OF[String(panels[i-1].id)].toUpperCase()}
                  </div>
                </div>
              )}
              <p.component
                progress={isActive ? panelProgress : 0}
                commit={(n) => commit(String(p.id), n)}
                onReady={(r) => setReady(String(p.id), r)}
              />
            </div>
          );
        })}
      </div>

      {/* trajectory line + ticks */}
      <div className="pointer-events-none absolute left-6 top-20 bottom-20 w-px bg-paper/12 z-20" />
      <div
        className="pointer-events-none absolute left-6 top-20 w-px z-20"
        style={{
          height: `calc((100% - 10rem) * ${progress})`,
          background: gateBlocked ? "linear-gradient(to bottom, #2DD4BF, #ef4444)" : "linear-gradient(to bottom, #2DD4BF, rgba(45,212,191,0.4))",
        }}
      />
      {panels.map((p, i) => {
        const tickY = 80 + (i / panels.length) * (typeof window === "undefined" ? 600 : window.innerHeight - 160);
        const isActive = i === panelIndex;
        const isPast = i < panelIndex;
        const earned_n = earned[String(p.id)] || 0;
        const isReady = readyMap[String(p.id)] ?? false;
        return (
          <div
            key={p.id}
            className="pointer-events-none absolute mono-xs z-20"
            style={{
              left: "34px",
              top: `${tickY}px`,
              fontSize: 10,
              opacity: isActive ? 1 : isPast ? 0.7 : 0.25,
              color: isActive ? "#2DD4BF" : "inherit",
              transition: "opacity 280ms cubic-bezier(0.16, 1, 0.3, 1), color 280ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {isActive ? (isReady ? "◉" : "●") : isPast ? (isReady ? "✓" : "✗") : "○"} {p.name}{earned_n > 0 && <span className="text-bright ml-1">×{earned_n}</span>}
          </div>
        );
      })}

      {/* verb pill */}
      <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 z-20 text-right">
        <div className="mono-xs opacity-40">verb</div>
        <div className="mono-xs text-bright" style={{ fontSize: 12, letterSpacing: "0.22em" }}>{activeVerb.toUpperCase()}</div>
        <div className="mono-xs opacity-40 mt-4">progress</div>
        <div className="mono-xs" style={{ fontSize: 16, letterSpacing: "0.1em" }}>{Math.round(panelProgress * 100)}%</div>
        {totalEarned > 0 && (
          <>
            <div className="mono-xs opacity-40 mt-4">verbs earned</div>
            <div className="mono-xs text-bright" style={{ fontSize: 16 }}>{totalEarned}</div>
          </>
        )}
        {gateBlocked && (
          <div className="mono-xs mt-4" style={{ color: "#ef4444", fontSize: 11 }}>
            gate: {gateBlocked}<br />complete verb
          </div>
        )}
      </div>

      {/* bottom rail HUD */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2 mono-xs opacity-70">
        04 / dissect — {String(panelIndex + 1).padStart(2, "0")} / {String(panels.length).padStart(2, "0")} · {active?.name} · {Math.round(panelProgress * 100)}%
        {gateBlocked && <span className="text-red-400 ml-3">[gate: {gateBlocked}]</span>}
      </div>
      <div className="pointer-events-none absolute bottom-14 left-1/2 z-20 -translate-x-1/2 mono-xs opacity-40">
        {active?.axis === "hairline" ? "scroll — moves the boundary" : `scroll — ${active?.axis}`}
      </div>
    </div>
  );
}
