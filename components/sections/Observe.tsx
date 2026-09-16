"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { announceStage } from "@/lib/session";

const ROWS: [string, string][] = [
  ["role", "devsecops engineer & cybersecurity specialist"],
  ["status", "intern @ cisai · ex innspark"],
  ["cert", "ccst — cisco certified cybersecurity technician"],
  ["base", "kerala, india"],
  ["current", "mca, amrita vishwa vidyapeetham"],
];

export default function Observe() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) announceStage("OBSERVE");
      },
      { threshold: 0.35 }
    );
    if (root.current) io.observe(root.current);

    const rows = root.current?.querySelectorAll(".ledger-row");
    gsap.fromTo(
      rows ?? [],
      { opacity: 0, x: -14 },
      {
        opacity: 1, x: 0, duration: 0.6, stagger: 0.08,
        ease: "power4.out",
        scrollTrigger: undefined as never,
        paused: true,
      }
    );
    return () => io.disconnect();
  }, []);

  return (
    <section ref={root} className="stage" data-stage="OBSERVE" id="observe">
      <div className="stage-label"><span>01</span><span>/</span><span>observe</span><span className="hr" /><span className="opacity-50">fact pattern</span></div>
      <div className="mt-14">
        {ROWS.map(([k, v]) => (
          <div key={k} className="ledger-row">
            <span className="k">{k}</span>
            <span className="v">{v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
