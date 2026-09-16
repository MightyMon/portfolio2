"use client";

import { useEffect, useRef, useState } from "react";
import { announceStage } from "@/lib/session";

export default function Report() {
  const root = useRef<HTMLElement>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) announceStage("REPORT"); },
      { threshold: 0.35 }
    );
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={root} className="stage" data-stage="REPORT" id="report">
      <div className="stage-label"><span>05</span><span>/</span><span>report</span><span className="hr" /><span className="opacity-50">contact — log the anomaly</span></div>

      <div className="mt-14 grid gap-14 md:grid-cols-[1fr_1.1fr] items-start">
        <div>
          <h2 className="display-c" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(2.4rem, 6vw, 4.6rem)" }}>
            anomaly?<br />write in.
          </h2>
          <div className="mono-md mt-8 space-y-3 opacity-80">
            <div><span className="text-bright">mail</span>&nbsp;&nbsp;hello@mighty.build</div>
            <div><span className="text-bright">gh</span>&nbsp;&nbsp;&nbsp;&nbsp;github.com/MightyMon</div>
            <div><span className="text-bright">li</span>&nbsp;&nbsp;&nbsp;&nbsp;linkedin.com/in/goutham-o-shibu-38b08a264</div>
          </div>
          <div className="mono-xs mt-10 opacity-50">response ≤ 24h · no forms routed through third parties</div>
        </div>

        <form
          className="logform"
          onSubmit={async (e) => {
            e.preventDefault();
            setSent(true);
            setTimeout(() => setSent(false), 3500);
          }}
        >
          <div className="row">
            <label>from:</label>
            <input name="from" placeholder="you@somewhere.tld" required />
          </div>
          <div className="row">
            <label>subject:</label>
            <input name="subject" placeholder="anomaly in the wild / brief / other" required />
          </div>
          <div className="row">
            <label>payload:</label>
            <textarea name="payload" rows={5} placeholder="what did you find?" required />
          </div>
          <div className="mt-8">
            <button type="submit" className="pill">
              {sent ? "sent ✓" : "send ▸"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
