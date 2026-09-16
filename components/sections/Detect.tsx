"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { announceStage } from "@/lib/session";

export default function Detect() {
  const root = useRef<HTMLElement>(null);
  const hairline = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) announceStage("DETECT"); },
      { threshold: 0.35 }
    );
    if (root.current) io.observe(root.current);

    const onScroll = () => {
      if (!root.current || !hairline.current || !left.current || !right.current) return;
      const r = root.current.getBoundingClientRect();
      const inner = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (r.height + window.innerHeight)));
      const t = 0.5 + (inner - 0.5) * 0.6; // 0.2..0.8 sway
      hairline.current.style.left = `${t * 100}%`;
      left.current.style.width = `${t * 100}%`;
      right.current.style.width = `${(1 - t) * 100}%`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  return (
    <section ref={root} className="stage" data-stage="DETECT" id="detect">
      <div className="stage-label"><span>03</span><span>/</span><span>detect</span><span className="hr" /><span className="opacity-50">offense · defense</span></div>

      <div className="relative mt-14" style={{ height: "58vh", minHeight: 420 }}>
        {/* LEFT — detection */}
        <div ref={left} className="absolute left-0 top-0 bottom-0 overflow-hidden border border-paper/15" style={{ width: "50%" }}>
          <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between">
            <div>
              <div className="mono-xs opacity-60 mb-3">clean lanes travel left</div>
              <div className="mono-md leading-relaxed opacity-80">
                ·▒▓░▒·▒░▒▓░▒·▒▓░·▒░▒▓▒·░▒▓▒░▒▓▒░·▒▓░▒·▒░
                <br />░▒▓·▒░▒░▒▓▒▓░·▒▓▒░▒░▓▒▒░▒▓░▒░·▒▓
                <br />▓·▒░▒▒░▓▒░·▒▓░▒▒▓░▒·▒░▒▓▒·░
              </div>
            </div>
            <div>
              <h2 className="display-c" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(1.6rem, 3.4vw, 3rem)" }}>
                malware detection<br />using llm
              </h2>
              <div className="mono-xs mt-3 opacity-60">precision · recall · false-positive cost</div>
            </div>
          </div>
        </div>

        {/* RIGHT — generation */}
        <div ref={right} className="absolute right-0 top-0 bottom-0 overflow-hidden bg-paper/5 border border-paper/15" style={{ width: "50%" }}>
          <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between">
            <div>
              <div className="mono-xs opacity-60 mb-3">hostile lanes jitter right</div>
              <div className="mono-md leading-relaxed opacity-90">
                <span className="text-bright">▓▓</span>·▒accent░·▒▒<span className="text-bright">▓</span>·accent·▒<span className="text-bright">▓░</span>·accent▒·<span className="text-bright">▓▓</span>
                <br />░accent▒<span className="text-bright">▓</span>·▒accent<span className="text-bright">▓▓</span>·▒accent·░▓<span className="text-bright">▓</span>
                <br />accent·<span className="text-bright">▓▓▓</span>·▒░accent·▒<span className="text-bright">▓</span>·▒
              </div>
            </div>
            <div>
              <h2 className="display-c text-bright" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(1.6rem, 3.4vw, 3rem)" }}>
                malware generation<br />using llm
              </h2>
              <div className="mono-xs mt-3 opacity-60">research-only · sandboxed · disclosed</div>
            </div>
          </div>
        </div>

        {/* hairline */}
        <div ref={hairline} className="absolute top-0 bottom-0 w-px bg-bright" style={{ left: "50%" }}>
          <div className="absolute top-1/2 -translate-y-1/2 -left-[7px] w-[14px] h-[14px] border border-bright bg-void" style={{ transform: "rotate(45deg) translateY(-50%)" }} />
        </div>
      </div>

      <div className="mono-xs opacity-50 mt-8 text-center">
        scroll drags the hairline — the visitor moves the boundary between offense and defense
      </div>
    </section>
  );
}
