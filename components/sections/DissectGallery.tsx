"use client";

import Rail from "@/components/dissect/Rail";
import StubPanel from "@/components/dissect/StubPanel";
import Sovrego from "@/components/dissect/panels/Sovrego";
import Breathalyzer from "@/components/dissect/panels/Breathalyzer";
import AccessControl from "@/components/dissect/panels/AccessControl";
import NetworkAnalyzer from "@/components/dissect/panels/NetworkAnalyzer";
import Exosky from "@/components/dissect/panels/Exosky";
import Homelab from "@/components/dissect/panels/Homelab";
import { useState } from "react";

const P: Record<string, React.ComponentType<{ progress: number }>> = {
  sovrego: Sovrego,
  breathalyzer: Breathalyzer,
  "access-control": AccessControl,
  "network-analyzer": NetworkAnalyzer,
  exosky: Exosky,
  homelab: Homelab,
  malwareDetection: (p) => <StubPanel {...p} name="malware detection" axis="hairline scrub" />,
  malwareGeneration: (p) => <StubPanel {...p} name="malware generation" axis="vertical ↓" />,
  community: (p) => <StubPanel {...p} name="gatherguide · ctf workshop" axis="horizontal →" />,
  whiteeye: (p) => <StubPanel {...p} name="whiteeye" axis="zoom-out" />,
};

const ORDER: { id: keyof typeof P; name: string; axis: string }[] = [
  { id: "sovrego", name: "sovrego", axis: "diagonal ↘" },
  { id: "breathalyzer", name: "breathalyzer", axis: "zoom-out" },
  { id: "access-control", name: "access control", axis: "horizontal →" },
  { id: "network-analyzer", name: "network analyzer", axis: "orbit ⟳" },
  { id: "exosky", name: "exosky", axis: "zoom-in" },
  { id: "homelab", name: "homelab", axis: "drag" },
  { id: "malwareDetection", name: "malware detection", axis: "hairline scrub" },
  { id: "malwareGeneration", name: "malware generation", axis: "vertical ↓" },
  { id: "community", name: "gatherguide", axis: "horizontal →" },
  { id: "whiteeye", name: "whiteeye", axis: "zoom-out" },
];

export default function DissectGallery() {
  // Render BOTH desktop rail and mobile list. CSS shows the right one.
  // SSR no longer mismatches: tree is the same on server and first client render.
  const panels = ORDER.map((o) => ({
    id: String(o.id),
    name: o.name,
    desc: "",
    axis: o.axis,
    verb: "",
    component: P[String(o.id)] as React.ComponentType<{ progress: number; commit?: (earned: number) => void; onReady?: (r: boolean) => void }>,
  }));

  return (
    <>
      {/* desktop: only visible ≥768px, rail uses ScrollTrigger that measures the visible DOM */}
      <div className="desktop-only">
        <Rail panels={panels} />
      </div>

      {/* mobile / SSR-fallback: only visible <768px */}
      <div className="mobile-only">
        <section className="stage" id="dissect">
          <div className="stage-label"><span>04</span><span>/</span><span>dissect</span><span className="hr" /><span className="opacity-50">tap-to-complete</span></div>
          <div className="mt-14 space-y-16">
            {panels.map((p) => (
              <MobileCard key={p.id} id={p.id} name={p.name} axis={p.axis} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function MobileCard({ id, name, axis }: { id: string; name: string; axis: string }) {
  const [done, setDone] = useState(false);
  const tap = () => setDone(true);
  return (
    <div onClick={tap} className={`border p-6 transition-all ${done ? "border-bright" : "border-paper/15"}`}>
      <div className="mono-xs opacity-60 mb-3">{axis}</div>
      <div className="display-c" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(1.6rem, 8vw, 3rem)" }}>{name}</div>
      <div className="mono-xs mt-4" style={{ opacity: done ? 1 : 0.4, color: done ? "var(--color-bright)" : "inherit" }}>
        {done ? "✓ task complete" : "tap to complete"}
      </div>
    </div>
  );
}
