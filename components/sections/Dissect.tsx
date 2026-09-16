"use client";

import { useEffect, useRef, useState } from "react";
import { announceStage, bump } from "@/lib/session";

type Trace = {
  id: string; glyph: string; name: string; desc: string;
  problem: string; decision: string; measured: string;
};

const TRACES: Trace[] = [
  {
    id: "T-001", glyph: "░▓▒", name: "sovrego", desc: "nl → rego via rag",
    problem: "compliance teams write rego by hand; domain experts can't ship policy.",
    decision: "agentic pipeline — chroma retrieval over opa corpus + qwen for synthesis; chunk-at-debt, not page-level.",
    measured: "phase1 offline eval green; vpn-span sov-in/eu/us on proxmox.",
  },
  {
    id: "T-002", glyph: "▒░▓", name: "breathalyzer", desc: "breath acetone → bgl",
    problem: "diabetics finger-prick 3-6×/day; non-invasive bgl is the open problem.",
    decision: "metal-oxide sensor array + signal fusion; calibrated against glucometer ground truth.",
    measured: "prototype reads within tolerance on baseline trials.",
  },
  {
    id: "T-003", glyph: "▓▒░", name: "access control", desc: "rp2040 · rfid · solenoid",
    problem: "cheap labs need role-based door access without full plant infra.",
    decision: "rp2040 firmware over cloned-off-the-shelf; rfid synergy w/ solenoid latching; hardware btb attestation.",
    measured: "field-trialled on campus lab door for a semester.",
  },
  {
    id: "T-004", glyph: "░▓▒", name: "network analyzer", desc: "graph · node · pcap",
    problem: "raw pcap eyes glaze over; investigators need topology, not bytes.",
    decision: "ingest → nodes/edges → layout; ts front over python ingest.",
    measured: "100k-packet capture renders interactively.",
  },
  {
    id: "T-005", glyph: "▒░▓", name: "exosky", desc: "space apps 2024 · sky",
    problem: "exoplanet-viable sky visualization under 48h hackathon constraints.",
    decision: "nasa archive math + three.js star dome; constrained to a single equirect projection.",
    measured: "submitted build runs in-browser; judges' shortlist.",
  },
  {
    id: "T-006", glyph: "▓▒░", name: "homelab", desc: "k8s + gpu · proxmox",
    problem: "single-host gpu experiments don't surface real-world failure modes.",
    decision: "proxmox vz + k8s on top; gpu passthrough; observability stack from day zero.",
    measured: "hosts llm inference, builds, and this portfolio.",
  },
];

export default function Dissect() {
  const root = useRef<HTMLElement>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [timers, setTimers] = useState<number[]>(() => TRACES.map(() => 0));
  const hoverAt = useRef<number[]>([]);
  const tick = useRef<number | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) announceStage("DISSECT"); },
      { threshold: 0.3 }
    );
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    tick.current = window.setInterval(() => {
      setTimers((t) => {
        const next = [...t];
        hoverAt.current.forEach((at, i) => {
          if (typeof at === "number" && openIdx !== i) {
            next[i] = Date.now() - at;
          }
        });
        return next;
      });
    }, 30);
    return () => { if (tick.current) window.clearInterval(tick.current); };
  }, [openIdx]);

  const fmt = (ms: number) => {
    if (ms <= 0) return "—";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.${String(Math.floor((ms % 1000) / 33)).padStart(2, "0")}`;
  };

  return (
    <section ref={root} className="stage" data-stage="DISSECT" id="dissect">
      <div className="stage-label"><span>03</span><span>/</span><span>dissect</span><span className="hr" /><span className="opacity-50">selected traces</span></div>

      <div className="mt-14">
        {TRACES.map((t, i) => {
          const open = openIdx === i;
          return (
            <div key={t.id}>
              <div
                className={`trace-row ${open ? "open" : ""}`}
                onMouseEnter={() => { hoverAt.current[i] = Date.now(); }}
                onMouseLeave={() => { hoverAt.current[i] = 0; setTimers((x) => x.map((v, j) => j === i && !open ? 0 : v)); }}
                onClick={() => {
                  setOpenIdx(open ? null : i);
                  bump("inspected");
                }}
              >
                <span className="id">{t.id}</span>
                <span className="glyph">{t.glyph}</span>
                <span className="name">{t.name}</span>
                <span className="desc">{t.desc}</span>
                <span className="timer">{open ? "inspecting" : fmt(timers[i] || 0)}</span>
              </div>
              <div className="trace-detail" style={{ maxHeight: open ? 320 : 0 }}>
                <div className="inner">
                  <div className="lbl">problem</div>
                  <div className="txt">{t.problem}</div>
                  <div className="lbl mt-3">decision</div>
                  <div className="txt">{t.decision}</div>
                  <div className="lbl mt-3">measured</div>
                  <div className="txt">{t.measured}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mono-xs opacity-50 mt-8">hover to time-inspect · click to open the trace</div>
    </section>
  );
}
