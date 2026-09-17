"use client";

import { useEffect, useRef, useState } from "react";
import { stashArtifact } from "@/lib/session";

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

export default function Sovrego({ progress, commit, onReady }: { progress: number; commit?: (n: number) => void; onReady?: (r: boolean) => void }) {
  const [compiled, setCompiled] = useState(0);
  useEffect(() => { onReady?.(compiled > 0); }, [compiled, onReady]);
  const [hintVisible, setHintVisible] = useState(true);
  const doCompile = () => {
    setCompiled((c) => {
      const next = c + 1;
      commit?.(next);
      if (next === 1) {
        const sha = "0x" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0").toUpperCase();
        stashArtifact({
          kind: "policy",
          label: `rego policy · sha ${sha}`,
          from: "sovrego",
        });
      }
      return next;
    });
    setHintVisible(false);
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
        </svg>

        {/* BIG click target on the dot */}
        <button
          onClick={doCompile}
          aria-label="compile intent into rego"
          className="absolute group"
          style={{
            left: `${30 + lineLen * 40}%`,
            top: `${35 + lineLen * 35}%`,
            transform: "translate(-50%, -50%)",
            width: 96, height: 96,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 12, height: 12, background: "#2DD4BF",
              boxShadow: compiled > 0
                ? "0 0 24px rgba(45,212,191,0.9)"
                : "0 0 12px rgba(45,212,191,0.6), 0 0 0 10px rgba(45,212,191,0.12)",
            }}
          />
          {/* pulse ring */}
          {compiled === 0 && (
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bright"
              style={{ width: 40, height: 40, animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite" }}
            />
          )}
        </button>

        {/* floating label near the dot */}
        {compiled === 0 && hintVisible && (
          <div
            className="absolute mono-xs pointer-events-none text-bright"
            style={{
              left: `calc(${30 + lineLen * 40}% + 60px)`,
              top: `${35 + lineLen * 35}%`,
              transform: "translateY(-50%)",
              letterSpacing: "0.2em",
              fontSize: 11,
            }}
          >
            ← click to compile
          </div>
        )}

        {compiled > 0 && (
          <div className="absolute right-12 top-12 mono-xs text-bright">
            ✓ policy compiled · sha 0x{Math.random().toString(16).slice(2, 8).toUpperCase()}
          </div>
        )}

        {/* handoff arrow — artifact exits right toward breathalyzer */}
        {compiled > 0 && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 mono-xs text-bright pointer-events-none" style={{ fontSize: 11, letterSpacing: "0.15em" }}>
            policy ▸
          </div>
        )}

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

        {/* instruction strip — visible until verb earned */}
        {compiled === 0 && (
          <div
            className="absolute left-1/2 bottom-8 -translate-x-1/2 mono-xs text-center"
            style={{
              color: "var(--color-ink)", background: "#2DD4BF",
              padding: "8px 16px", borderRadius: 2, letterSpacing: "0.18em", fontSize: 11,
            }}
          >
            TASK — click the teal dot on the diagonal to compile nl → rego
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <div className="mono-xs opacity-50">{compiled > 0 ? `compiled ×${compiled} ✓ — gate open` : done ? "translated · awaiting compile" : "translating…"}</div>
        <div className="mono-xs opacity-50">{Math.round(progress * 100)}%</div>
      </div>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes ping {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.6; }
          70% { transform: translate(-50%,-50%) scale(2.6); opacity: 0; }
          100% { transform: translate(-50%,-50%) scale(2.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
