// session metrics bus — everything on the page reports into / reads from here.
export type LoopMetrics = {
  packets: number;
  inspected: number;
  anomalies: number;
  startAt: number;
  maxScroll: number;
};

let metrics: LoopMetrics = {
  packets: 0,
  inspected: 0,
  anomalies: 0,
  startAt: Date.now(),
  maxScroll: 0,
};

const listeners = new Set<(m: LoopMetrics) => void>();

export function bump<K extends "packets" | "inspected" | "anomalies">(key: K, by = 1) {
  metrics[key] += by;
  emit();
}

export function setMaxScroll(v: number) {
  metrics.maxScroll = Math.max(metrics.maxScroll, v);
  emit();
}

export function snapshot(): LoopMetrics {
  return { ...metrics };
}

export function onMetrics(fn: (m: LoopMetrics) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  const m = { ...metrics };
  for (const fn of listeners) fn(m);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mighty:metrics", { detail: m }));
  }
}

export function announceStage(stage: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mighty:stage", { detail: stage }));
  }
}

export function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
