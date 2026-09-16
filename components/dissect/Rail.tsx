"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { announceStage, bump } from "@/lib/session";

gsap.registerPlugin(ScrollTrigger);

export type PanelSpec = {
  id: string;
  name: string;
  desc: string;
  axis: string;
  component: React.ComponentType<{ progress: number }>; // 0..1 within panel
};

export default function Rail({ panels }: { panels: PanelSpec[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

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
        const p = self.progress;
        setProgress(p);
        announceStage("DISSECT");
        bump("packets", 0); // keep ticker fresh
      },
    });

    const raf = () => {
      const p = st.progress;
      const x = -travel * p;
      rail.style.transform = `translate3d(${x}px, 0, 0)`;
    };
    const ticker = gsap.ticker.add(raf);

    return () => {
      st.kill();
      gsap.ticker.remove(ticker);
    };
  }, [panels]);

  const panelIndex = Math.min(panels.length - 1, Math.floor(progress * panels.length));
  const panelProgress = (progress * panels.length) % 1;
  const active = panels[panelIndex];

  return (
    <div ref={wrapRef} className="relative" style={{ height: "100vh" }}>
      <div ref={railRef} className="absolute left-0 top-0 flex" style={{ width: `${panels.length * 100}vw`, willChange: "transform" }}>
        {panels.map((p, i) => (
          <div key={p.id} className="relative h-screen w-screen flex-none overflow-hidden" data-rail-panel={p.id}>
            {/* panel cap — axis label top-left */}
            <div className="absolute left-6 top-20 z-10 mono-xs opacity-55">{`axis: ${p.axis}`}</div>
            <div className="absolute left-6 top-6 z-10 mono-xs opacity-45">{`T-${String(i + 1).padStart(3, "0")}`}</div>
            <p.component progress={panelIndex === i ? panelProgress : 0} />
          </div>
        ))}
      </div>

      {/* rail HUD */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2 mono-xs opacity-70">
        03 / dissect — {String(panelIndex + 1).padStart(2, "0")} / {String(panels.length).padStart(2, "0")} · {active?.name} · {Math.round(panelProgress * 100)}%
      </div>
      <div className="pointer-events-none absolute bottom-14 left-1/2 z-20 -translate-x-1/2 mono-xs opacity-40">
        {active?.axis === "hairline" ? "scroll — moves the boundary" : `scroll — ${active?.axis}`}
      </div>
    </div>
  );
}
