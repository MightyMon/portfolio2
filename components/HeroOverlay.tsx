"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function HeroOverlay() {
  const barRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const aliasRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to(barRef.current, { scaleX: 0, duration: 1.1, transformOrigin: "left center" }, 0.25)
      .fromTo(
        nameRef.current,
        { yPercent: 24, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.0 },
        0.6
      )
      .fromTo(
        [aliasRef.current, metaRef.current],
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 },
        1.0
      )
      .fromTo(cueRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.3);
    return () => { tl.kill(); };
  }, []);

  return (
    <div className="relative z-10 flex min-h-[100svh] flex-col justify-between px-6 pb-10 pt-20 md:px-12 md:pb-14">
      {/* top space (corners overlay sits above) */}
      <div className="mono-xs opacity-60">`wake the loop — the visitor is the traffic`</div>

      {/* name block */}
      <div>
        <div ref={barRef} className="mb-6 h-px w-24 origin-left bg-paper/60" style={{ transform: "scaleX(1)" }} />
        <h1
          ref={nameRef}
          className="display-c"
          style={{
            fontSize: "clamp(4.5rem, 16vw, 17rem)",
            fontStyle: "italic",
            fontWeight: 700,
            textShadow: "0 0 24px rgba(11,12,9,0.9), 0 0 80px rgba(11,12,9,0.8)",
          }}
        >
          mighty<span className="text-bright" style={{ textShadow: "0 0 24px rgba(11,12,9,0.9), 0 0 80px rgba(11,12,9,0.8)" }}>.</span>
        </h1>
        <div ref={aliasRef} className="mono-xs mt-4 opacity-80" style={{ fontSize: "15px" }}>
          goutham o shibu — cisai · amrita · kerala/in
        </div>
        <div ref={metaRef} className="mono-xs mt-6 max-w-md opacity-70">
          devsecops engineer <span className="text-bright">&amp;</span> cybersecurity specialist
          <br />instrumented systems. measured loops.
        </div>
      </div>

      {/* bottom cue */}
      <div ref={cueRef} className="flex items-baseline justify-between">
        <div className="mono-xs opacity-60">scroll to inspect&nbsp;&nbsp;▍</div>
        <div className="mono-xs opacity-40">00 / boot — packet field live · anomalies flagged on contact</div>
      </div>
    </div>
  );
}
