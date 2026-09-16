"use client";

import { useEffect, useRef, useState } from "react";
import { announceStage, snapshot, formatDuration, onMetrics, LoopMetrics } from "@/lib/session";

export default function LoopClosed() {
  const root = useRef<HTMLElement>(null);
  // initialize with stable SSR values; populate from snapshot() inside effect (no hydration mismatch)
  const [m, setM] = useState<LoopMetrics>({ packets: 0, inspected: 0, anomalies: 0, startAt: 0, maxScroll: 0 });
  const [now, setNow] = useState(0);

  useEffect(() => {
    setM(snapshot());
    setNow(Date.now());
    const io = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) announceStage("LOOP CLOSED"); },
      { threshold: 0.3 }
    );
    if (root.current) io.observe(root.current);
    const un = onMetrics(setM);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => { io.disconnect(); un(); clearInterval(t); };
  }, []);

  const dur = formatDuration(now - m.startAt);

  return (
    <section ref={root} className="stage pb-32" data-stage="LOOP CLOSED" id="loopclosed">
      <div className="stage-label"><span>06</span><span>/</span><span>loop closed</span><span className="hr" /><span className="opacity-50">session summary</span></div>

      <div className="mt-14 max-w-2xl">
        <div className="loop-row"><span>time on site</span><span className="v">{dur}</span></div>
        <div className="loop-row"><span>scroll depth</span><span className="v">{m.maxScroll}%</span></div>
        <div className="loop-row"><span>anomalies flagged</span><span className="v text-bright">{m.anomalies}</span></div>
        <div className="loop-row"><span>packets inspected</span><span className="v">{m.inspected}</span></div>
        <div className="loop-row"><span>verbs earned</span><span className="v text-bright">{m.inspected > 0 ? `${m.inspected}` : "—"}</span></div>

        <div className="mt-12">
          <a href="#top" className="pill">↺ loop closed — run again?</a>
        </div>
      </div>

      <div className="mt-24 flex justify-between mono-xs opacity-50">
        <span>© 2026 goutham o shibu · aka mighty</span>
        <span>built with next.js · three.js · packet fields</span>
      </div>
    </section>
  );
}
