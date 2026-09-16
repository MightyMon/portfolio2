"use client";

import { useEffect, useRef } from "react";
import { announceStage } from "@/lib/session";

export default function Respond() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) announceStage("RESPOND"); },
      { threshold: 0.35 }
    );
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={root} className="stage invert-stage" data-stage="RESPOND" id="respond">
      <div className="stage-label"><span>02</span><span>/</span><span>respond</span><span className="hr" /><span className="opacity-50">the loop as method</span></div>

      <div className="mt-14 grid gap-16 md:grid-cols-[1fr_360px] items-start">
        <div>
          <h2 className="display-c" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(2.4rem, 6vw, 5rem)" }}>
            how i work
          </h2>
          <ul className="mono-md mt-10 max-w-xl space-y-5 leading-relaxed">
            <li>— instrument everything.</li>
            <li>— assume breach.</li>
            <li>— close the loop.</li>
            <li className="pt-4 text-ink/70">
              icpc 2023 taught me timeboxed reps. karate taught me discipline. speaking at
              public events taught me disclosure. systems that watch themselves are the only
              ones worth shipping.
            </li>
          </ul>
        </div>

        {/* orbit ring — the only animated thing here */}
        <div className="relative aspect-square w-full max-w-sm">
          <div className="absolute inset-0 rounded-full border border-ink/35" />
          <div className="absolute inset-[22%] rounded-full border border-ink/20" />
          <div className="absolute inset-[44%] rounded-full border border-ink/12" />
          <div className="animate-spin absolute inset-0" style={{ animationDuration: "24s", animationTimingFunction: "linear" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-teal" />
          </div>
          <div className="animate-spin absolute inset-0" style={{ animationDuration: "32s", animationTimingFunction: "linear", animationDirection: "reverse" }}>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-ink/60" />
          </div>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div className="mono-xs" style={{ color: "rgba(20,20,20,.55)" }}>breath loop<br />— measures what matters —</div>
          </div>
        </div>
      </div>

      <div className="mono-xs mt-16" style={{ color: "rgba(20,20,20,.5)" }}>
        the only motion in this section is process. boring. by design.
      </div>
    </section>
  );
}
