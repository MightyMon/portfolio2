"use client";

// Placeholder panels that stand in until M3c ships the real ones.
// They render the project name + axis label + a teal hairline so rail progress is visible.
// For these stubs, the rail gate auto-pass (onReady(true) immediately) so scrolling continues.

import { useEffect } from "react";

export default function StubPanel({
  progress,
  name,
  axis,
  onReady,
}: {
  progress: number;
  name: string;
  axis: string;
  onReady?: (r: boolean) => void;
}) {
  useEffect(() => { onReady?.(true); }, [onReady]);
  return (
    <div className="flex h-full w-full flex-col justify-between p-12 pl-24">
      <div className="stage-label"><span>{name}</span><span className="hr" /><span className="opacity-45">{axis}</span></div>
      <div className="self-center">
        <div className="display-c text-bright" style={{ fontStyle: "italic", fontWeight: 700, fontSize: "clamp(2.4rem, 7vw, 6rem)" }}>{name}</div>
        <div className="mono-xs mt-3 opacity-60">{axis} · progress {Math.round(progress * 100)}%</div>
      </div>
      <div className="mono-xs opacity-40">stub · pending real panel in m3c</div>
    </div>
  );
}

