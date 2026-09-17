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

// ── artifact bus — panels hand artifacts to each other ─────────────────────

export type ArtifactKind = "policy" | "signature" | "doorOpen" | "pcap" | "catalogEntry" | "sync";
export type Artifact = {
  kind: ArtifactKind;
  /** short human label like "rego policy · sha 0xAB12" */
  label: string;
  /** which panel produced it (so the next panel can show '← fed by X') */
  from: string;
  at: number;
};

const artifacts: Artifact[] = [];
const artifactListeners = new Set<(a: Artifact) => void>();

export function stashArtifact(a: Omit<Artifact, "at">) {
  const withTime: Artifact = { ...a, at: Date.now() };
  artifacts.push(withTime);
  for (const fn of artifactListeners) fn(withTime);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<Artifact>("mighty:artifact", { detail: withTime }));
  }
}

export function onArtifact(fn: (a: Artifact) => void) {
  artifactListeners.add(fn);
  return () => { artifactListeners.delete(fn); };
}

export function latestArtifact(kind: ArtifactKind): Artifact | undefined {
  for (let i = artifacts.length - 1; i >= 0; i--) {
    if (artifacts[i].kind === kind) return artifacts[i];
  }
  return undefined;
}

export function allArtifacts(): Artifact[] {
  return [...artifacts];
}

// ── sound — tiny synth for verb moments ─────────────────────────────────
let actx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!actx) {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
  }
  if (actx && actx.state === "suspended") actx.resume().catch(() => {});
  return actx;
}

/** Punchy mono bleep at given freq + decay. `at` offsets the start (for stacking). */
export function blip(freq = 880, decay = 0.14, at = 0) {
  const c = ctx();
  if (!c) return;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, t0);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t0 + decay);
  g.gain.setValueAtTime(0.06, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + decay + 0.02);
}

/** heavier lock-in thunk (used for dock/lock moments) */
export function thunk() {
  blip(220, 0.18, 0);
  blip(110, 0.22, 0.04);
}

/** ascending two-note for artifact handoff */
export function handoff() {
  blip(660, 0.1, 0);
  blip(990, 0.12, 0.08);
}
