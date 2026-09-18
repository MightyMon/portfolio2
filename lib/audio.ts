// Soundtrack engine — procedural SOC-terminal vibe.
// Layered: low pad drone + slow LFO on filter + occasional blip accents (already-built blip/thunk/handoff ride on top).

type AudioEngine = {
  start: () => void;
  stop: () => void;
  setMasterGain: (v: number) => void;
  isRunning: () => boolean;
};

let engine: AudioEngine | null = null;

export function getEngine(): AudioEngine {
  if (engine) return engine;

  let actx: AudioContext | null = null;
  let master: GainNode | null = null;
  let running = false;
  let nodes: OscillatorNode[] = [];
  let lfoNode: OscillatorNode | null = null;
  let padGain: GainNode | null = null;
  let padFilter: BiquadFilterNode | null = null;
  let accentTimer: ReturnType<typeof setInterval> | null = null;

  const ensureCtx = (): AudioContext | null => {
    if (actx) return actx;
    const AC = typeof window !== "undefined" ? ((window as any).AudioContext || (window as any).webkitAudioContext) : null;
    if (!AC) return null;
    const fresh = new AC();
    actx = fresh;
    const freshMaster = fresh.createGain();
    master = freshMaster;
    freshMaster.gain.value = 0.0;
    freshMaster.connect(fresh.destination);
    return actx;
  };

  const startPad = () => {
    const c = ensureCtx();
    if (!c) return;
    // pad = 2 detuned sine voices + a high partial wobble
    const v1 = c.createOscillator();
    v1.type = "sine"; v1.frequency.value = 55;      // A1
    const v2 = c.createOscillator();
    v2.type = "sine"; v2.frequency.value = 55.4;    // slightly detuned — slow beat
    const v3 = c.createOscillator();
    v3.type = "sine"; v3.frequency.value = 220.6;   // high shimmer
    const v3Gain = c.createGain(); v3Gain.gain.value = 0.12;

    padFilter = c.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 320;
    padFilter.Q.value = 0.6;

    // slow filter LFO
    lfoNode = c.createOscillator();
    lfoNode.type = "sine"; lfoNode.frequency.value = 0.05; // 20-second sweep
    const lfoGain = c.createGain(); lfoGain.gain.value = 80;
    lfoNode.connect(lfoGain).connect(padFilter.frequency);

    padGain = c.createGain();
    padGain.gain.value = 0.34;

    v1.connect(padFilter);
    v2.connect(padFilter);
    v3.connect(v3Gain).connect(padFilter);
    padFilter.connect(padGain).connect(master!);

    v1.start(); v2.start(); v3.start(); lfoNode.start();
    nodes.push(v1, v2, v3);
  };

  const startAccents = () => {
    const c = ensureCtx();
    if (!c) return;
    const notes = [220, 277, 330, 415]; // A major-ish quiet arpeggio
    accentTimer = setInterval(() => {
      // only fire if master gain is non-zero (user enabled sound)
      if (!master || master.gain.value === 0) return;
      const t = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      const n = notes[Math.floor(Math.random() * notes.length)];
      osc.frequency.setValueAtTime(n, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(g).connect(master!);
      osc.start(t);
      osc.stop(t + 1.5);
    }, 4200);
  };

  engine = {
    start: () => {
      if (running) return;
      const c = ensureCtx();
      if (!c) return;
      c.resume().catch(() => {});
      startPad();
      startAccents();
      // ramp master in over 1.2s so it's not jarring
      if (master) {
        master.gain.setTargetAtTime(0.55, c.currentTime, 0.4);
      }
      running = true;
    },
    stop: () => {
      if (!running || !actx || !master) return;
      master.gain.setTargetAtTime(0, actx.currentTime, 0.3);
      setTimeout(() => {
        nodes.forEach((n) => n.stop());
        if (lfoNode) lfoNode.stop();
        nodes = [];
        if (accentTimer) clearInterval(accentTimer);
      }, 1200);
      running = false;
    },
    setMasterGain: (v: number) => {
      if (!actx || !master) return;
      master.gain.setTargetAtTime(v, actx.currentTime, 0.2);
    },
    isRunning: () => running,
  };
  return engine;
}
