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
  verb: string; // what the visitor commits in this panel
  component: React.ComponentType<{ progress: number; commit?: (earned: number) => void }>;
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

  const commit = (panelId: string, earnedCount: number) => {
    setEarned((e) => ({ ...e, [panelId]: earnedCount }));
    bump("inspected", earnedCount);
  };

  useEffect(() => {
    if (!wrapRef.current || !railRef.current) return;
    const rail = railRef.current;
    const travel = rail.scrollWidth - window.innerWidth;

    const st = ScrollTrigger.create({
      trigger: wrapRef.current,
      start: "top top",
      end: () => "+=" + (travel + window.innerHeight * 0.5),
      pin: true,
      scrub: 0.4,
      onUpdate: (self) => {
        setProgress(self.progress);
        announceStage("DISSECT");
      },
    });

    const raf = () => {
      const p = st.progress;
      const x = -travel * p;
      rail.style.transform = `translate3d(${x}px, 0, 0)`;
    };
    const ticker = gsap.ticker.add(raf);
    return () => { st.kill(); gsap.ticker.remove(ticker); };
  }, [panels]);

  const panelIndex = Math.min(panels.length - 1, Math.floor(progress * panels.length));
  const panelProgress = (progress * panels.length) % 1;
  const active = panels[panelIndex];
  const activeVerb = VERB_OF[String(active?.id)] || "operate";

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
              <p.component progress={isActive ? panelProgress : 0} commit={(n) => commit(String(p.id), n)} />
            </div>
          );
        })}
      </div>

      {/* trajectory line — grows with progress (top→bottom along left edge) */}
      <div className="pointer-events-none absolute left-6 top-20 bottom-20 w-px bg-paper/12 z-20" />
      <div
        className="pointer-events-none absolute left-6 top-20 w-px z-20"
        style={{
          height: `calc((100% - 10rem) * ${progress})`,
          background: "linear-gradient(to bottom, #2DD4BF, rgba(45,212,191,0.4))",
        }}
      />

      {/* panel ticks with earned dots */}
      {panels.map((p, i) => {
        const tickY = 80 + (i / panels.length) * (typeof window === "undefined" ? 600 : window.innerHeight - 160);
        const isActive = i === panelIndex;
        const isPast = i < panelIndex;
        const earned_n = earned[String(p.id)] || 0;
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
            {isActive ? "●" : isPast ? (earned_n > 0 ? "✓+" : "✓") : "○"} {p.name}{earned_n > 0 && <span className="text-bright ml-1">×{earned_n}</span>}
          </div>
        );
      })}

      {/* verb pill — right side */}
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
      </div>

      {/* bottom rail HUD */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2 mono-xs opacity-70">
        04 / dissect — {String(panelIndex + 1).padStart(2, "0")} / {String(panels.length).padStart(2, "0")} · {active?.name} · {Math.round(panelProgress * 100)}%
      </div>
      <div className="pointer-events-none absolute bottom-14 left-1/2 z-20 -translate-x-1/2 mono-xs opacity-40">
        {active?.axis === "hairline" ? "scroll — moves the boundary" : `scroll — ${active?.axis}`}
      </div>
    </div>
  );
}
