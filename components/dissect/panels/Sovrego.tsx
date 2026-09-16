"use client";

import { useEffect, useState } from "react";

const STEPS = ["reformulate", "retrieve", "synthesize"];

export default function Sovrego({ progress }: { progress: number }) {
  const stepIdx = Math.min(2, Math.floor(progress * 3));
  const lineLen = Math.min(1, progress);
  return (
    <div className="flex h-full w-full flex-col justify-between p-12">
      <div className="stage-label"><span>T-001</span><span>/</span><span>sovrego</span><span className="hr" /><span className="opacity-50">diagonal axis</span></div>

      <div className="relative flex-1">
        {/* nl intent — top left */}
        <div className="absolute left-0 top-8 max-w-sm">
          <div className="mono-xs opacity-60 mb-3">nl intent</div>
          <pre className="mono-md" style={{ fontSize: 12, lineHeight: 1.7 }}>{`\`\`\`
policy: secrets_store
require:
- encryption at_rest
- rotation every 90d
- audit on read
\`\`\``}</pre>
        </div>

        {/* rego — bottom right */}
        <div className="absolute bottom-4 right-0 max-w-sm">
          <div className="mono-xs opacity-60 mb-3">rego</div>
          <pre className="mono-md" style={{ fontSize: 12, lineHeight: 1.7 }}>{`\`\`\`
package secrets.authz

default allow := false

allow {
  input.encrypted_at_rest
  input.rotation_days <= 90
  audit_logged[input.principal]
}
\`\`\``}</pre>
        </div>

        {/* diagonal route */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <line
            x1="30" y1="35" x2="70" y2="70"
            stroke="#2DD4BF" strokeWidth="0.7"
            strokeDasharray="100" strokeDashoffset={100 - lineLen * 100}
          />
          <circle cx={30 + lineLen * 40} cy={35 + lineLen * 35} r="1.2" fill="#2DD4BF" />
        </svg>

        {/* left rail steps */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 space-y-4">
          {STEPS.map((s, i) => (
            <div key={s} className={`mono-xs transition-all ${i <= stepIdx ? "opacity-100 text-bright" : "opacity-35"}`}>
              {i <= stepIdx ? "●" : "○"} {s}
            </div>
          ))}
        </div>

        {/* name */}
        <div className="display-c absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(3rem, 8vw, 7rem)" }}>
          sovrego
        </div>
      </div>

      <div className="flex justify-between">
        <div className="mono-xs opacity-50">{progress < 1 ? "translating…" : "resolved ✓"}</div>
        <div className="mono-xs opacity-50">{Math.round(progress * 100)}%</div>
      </div>
    </div>
  );
}
