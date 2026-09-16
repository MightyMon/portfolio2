// Rail progress plumbing — each panel is passed a 0..1 value (see Rail.tsx).
// Panels that are "live" animate via useFrame; others update via useEffect watching progress.

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

// Use this inside any R3F child of a rail panel.
// pattern: const ref = useRailProgress<THREE.Group>(progress);
// then in useFrame relabel ref.current transforms from railProgress.current (0..1).
export function useRailProgress(progress: number) {
  const railProgress = useRef(progress);
  useFrame(() => { railProgress.current = progress; });
  return railProgress;
}
