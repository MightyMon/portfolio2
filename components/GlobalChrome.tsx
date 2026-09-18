"use client";

import { useEffect, useState } from "react";
import GuideChip from "@/components/GuideChip";
import { getEngine } from "@/lib/audio";

const GUIDE: Record<string, string> = {
  BOOT:        "wake the loop. scroll down to start observing.",
  OBSERVE:     "read the ledger. each row is something mighty shipped. scroll to advance.",
  RESPOND:     "this is how mighty works. read the four lines, then scroll on.",
  DETECT:      "the hairline is a boundary. watch it respond to scroll.",
  DISSECT:     "each project is a task. complete it to advance. watch the guide at top.",
  REPORT:      "leave a message. it'll land in mighty's inbox.",
  "LOOP CLOSED": "loop finished. artifact chain at the bottom — see what handed to what.",
};

export default function GlobalChrome() {
  const [stage, setStage] = useState("BOOT");
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const onStage = (e: Event) => setStage((e as CustomEvent<string>).detail);
    window.addEventListener("mighty:stage", onStage);
    return () => window.removeEventListener("mighty:stage", onStage);
  }, []);

  const toggleSound = () => {
    const eng = getEngine();
    if (!soundOn) {
      eng.start();
      setSoundOn(true);
    } else {
      eng.stop();
      setSoundOn(false);
    }
  };

  return (
    <>
      <GuideChip message={GUIDE[stage]} />
      <button
        onClick={toggleSound}
        aria-label={soundOn ? "sound off" : "sound on"}
        className="fixed right-4 top-4 z-40 mono-xs border px-2 py-1"
        style={{
          letterSpacing: "0.18em", fontSize: 10,
          background: soundOn ? "#2DD4BF" : "transparent",
          color: soundOn ? "var(--color-ink)" : "#2DD4BF",
          borderColor: "rgba(45,212,191,0.4)",
          borderRadius: 2,
        }}
      >
        {soundOn ? "sound: on" : "sound: off"}
      </button>
    </>
  );
}
