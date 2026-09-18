"use client";

import { useEffect, useState } from "react";

/**
 * Guide chip — sits top-right (under corner furniture) and tells the user what to do.
 * Slides in when message changes, then collapses after 6s to a small "?" dot.
 * Tap/click it to re-expand.
 */
export default function GuideChip({ message }: { message: string | null }) {
  const [open, setOpen] = useState(true);
  const [current, setCurrent] = useState(message);
  useEffect(() => {
    if (message && message !== current) {
      setCurrent(message);
      setOpen(true);
    }
  }, [message, current]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), 6000);
    return () => clearTimeout(t);
  }, [open, current]);

  if (!current) return null;
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className="fixed right-4 top-20 z-40 mono-xs text-left transition-all pointer-events-auto"
      style={{
        letterSpacing: "0.14em",
        fontSize: 10,
        padding: open ? "10px 14px" : "10px",
        background: open ? "#2DD4BF" : "rgba(45, 212, 191, 0.15)",
        color: open ? "var(--color-ink)" : "#2DD4BF",
        border: "1px solid rgba(45, 212, 191, 0.4)",
        maxWidth: open ? 260 : 24,
        borderRadius: 2,
      }}
    >
      {open ? (
        <div>
          <div style={{ opacity: 0.6, letterSpacing: "0.2em", fontSize: 9 }}>GUIDE</div>
          <div className="mt-1" style={{ letterSpacing: "0.1em", lineHeight: 1.5, fontSize: 11 }}>{current}</div>
        </div>
      ) : (
        <div style={{ transform: "rotate(-90deg)", fontSize: 10 }}>?</div>
      )}
    </button>
  );
}
