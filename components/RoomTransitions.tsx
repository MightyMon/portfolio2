"use client";

import { useEffect } from "react";

/**
 * Listens for `.stage` sections entering viewport and plays a "cut" animation
 * (fade + clip-path expand + tiny scale snap) — replaces the previous glitchy
 * continuous-scroll feel with discrete room transitions.
 */
export default function RoomTransitions() {
  useEffect(() => {
    const stages = document.querySelectorAll<HTMLElement>(".stage");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.animate(
              [
                { opacity: 0, clipPath: "inset(6% 4% 6% 4%)", transform: "scale(0.99)" },
                { opacity: 1, clipPath: "inset(0 0 0 0)", transform: "scale(1)" },
              ],
              { duration: 480, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
            );
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.06 }
    );
    stages.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return null;
}
