"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = ["reformulate", "retrieve", "synthesize"];

const NL_BLOCK = `policy: secrets_store
require:
- encryption at_rest
- rotation every 90d
- audit on read`;

const REGO_BLOCK = `package secrets.authz

default allow := false

allow {
  input.encrypted_at_rest
  input.rotation_days <= 90
  audit_logged[input.principal]
}`;

export default function Sovrego({ progress, commit }: { progress: number; commit?: (n: number) => void }) {
  const [compiled, setCompiled] = useState(0);
  const doCompile = () => {
    if (progress > 0.7 && commit) {
      setCompiled((c) => c + 1);
      commit(compiled + 1);
    }
  };
  const stepIdx = Math.min(2, Math.floor(progress * 3));
  const lineLen = Math.min(1, progress * 1.08);
  const done = progress > 0.96;
  // typing effect on nl intent
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const target = Math.round(NL_BLOCK.length * Math.min(1, progress * 1.4));
    setShown(target);
  }, [progress]);

  return (
    <div className="flex h-full w-full flex-col justify-between p-12 pl-24">
      <div className="stage-label"><span>T-001</span><span>/</span><span>sovrego</span><span className="hr" /><span className="opacity-50">diagonal axis</span></div>

      <div className="relative flex-1">
        {/* nl intent — top left */}
        <div className="absolute left-0 top-8 max-w-sm">
          <div className="mono-xs opacity-60 mb-3">nl intent</div>
          <pre className="mono-md" style={{ fontSize: 12, lineHeight: 1.7 }}>
            {NL_BLOCK.slice(0, shown)}
            <span className="text-bright" style={{ animation: "blink 1s step-end infinite" }}>▍</span>
          </pre>
        </div>

        {/* rego — bottom right */}
        <div className="absolute bottom-4 right-0 max-w-sm" style={{ opacity: Math.min(1, Math.max(0, (progress - 0.4) * 2)) }}>
          <div className="mono-xs opacity-60 mb-3">rego</div>
          <pre className="mono-md" style={{ fontSize: 12, lineHeight: 1.7, color: progress > 0.65 ? "#2DD4BF" : "rgba(237,240,232,0.85)" }}>{REGO_BLOCK}</pre>
        </div>

        {/* diagonal route */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <line
            x1="30" y1="35" x2="70" y2="70"
            stroke="#2DD4BF" strokeWidth="0.7"
            strokeDasharray="100" strokeDashoffset={100 - lineLen * 100}
            style={{ filter: done ? "drop-shadow(0 0 6px rgba(45,212,191,0.6))" : undefined }}
          />
          <circle
            cx={30 + lineLen * 40} cy={35 + lineLen * 35} r="2.4" fill="#2DD4BF"
            style={{ cursor: progress > 0.7 ? "pointer" : "default" }}
            onClick={doCompile}
          />
          {compiled > 0 && <text x={30 + lineLen * 40 + 4} y={35 + lineLen * 35} fill="#2DD4BF" fontSize="6" fontFamily="monospace">sha ✓</text>}
        </svg>

        {/* three steps rail */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 space-y-4">
          {STEPS.map((s, i) => (
            <div key={s} className={`mono-xs transition-all ${i <= stepIdx ? "opacity-100 text-bright" : "opacity-35"}`}>
              {i <= stepIdx ? "●" : "○"} {s}
            </div>
          ))}
        </div>

        {/* name */}
        <div
          className="display-c absolute left-1/3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(3rem, 8vw, 7rem)", opacity: done ? 0.15 : 0.4 }}
        >
          sovrego
        </div>
      </div>

      <div className="flex justify-between">
        <div className="mono-xs opacity-50">{compiled > 0 ? `compiled ×${compiled} ✓` : done ? "resolved ✓" : "translating…"}</div>
        <div className="mono-xs opacity-50">{Math.round(progress * 100)}%</div>
      </div>

      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}
