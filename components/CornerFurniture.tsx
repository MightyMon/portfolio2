"use client";

import { useEffect, useState } from "react";
import type { LoopMetrics } from "@/lib/session";

const STAGES = [
  "BOOT", "OBSERVE", "DETECT", "DISSECT", "RESPOND", "REPORT", "LOOP CLOSED",
];

export default function CornerFurniture() {
  const [stage, setStage] = useState("BOOT");
  const [packets, setPackets] = useState(0);
  const [clock, setClock] = useState("--:--");
  const [sessionId, setSessionId] = useState("0x···"); // placeholder — hydrated client-side
  useEffect(() => {
    setSessionId("0x" + Math.floor(Math.random() * 0xfff).toString(16).padStart(3, "0").toUpperCase());
  }, []);

  useEffect(() => {
    const onStage = (e: Event) => setStage((e as CustomEvent<string>).detail);
    const onPkts = (e: Event) => setPackets(((e as CustomEvent<LoopMetrics>).detail).packets ?? 0);
    window.addEventListener("mighty:stage", onStage);
    window.addEventListener("mighty:metrics", onPkts);
    const t = setInterval(() => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    }, 1000);
    return () => {
      window.removeEventListener("mighty:stage", onStage);
      window.removeEventListener("mighty:metrics", onPkts);
      clearInterval(t);
    };
  }, []);

  return (
    <>
      <div className="corner tl">mighty ✦ <span className="acc">◆</span> g. shibu</div>
      <div className="corner tr">session <span className="acc">{sessionId}</span></div>
      <div className="corner bl">stage <span className="acc">{stage}</span> / {STAGES.length - 1}</div>
      <div className="corner br">packets {String(packets).padStart(4, "0")} · t {clock}</div>
    </>
  );
}
