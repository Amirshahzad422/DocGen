"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

export function CountUp({ value }: { value: number | null }) {
  const node = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);

  useLayoutEffect(() => {
    if (value === null || !node.current) return;

    const target = node.current;
    const state = { value: previous.current };
    const mm = gsap.matchMedia();

    mm.add(
      { reduceMotion: "(prefers-reduced-motion: reduce)" },
      (context) => {
        if (context.conditions?.reduceMotion) {
          target.textContent = value.toLocaleString();
          return;
        }

        gsap.to(state, {
          value,
          duration: 0.75,
          ease: "power2.out",
          onUpdate: () => {
            target.textContent = Math.round(state.value).toLocaleString();
          },
        });
      },
    );

    previous.current = value;
    return () => mm.revert();
  }, [value]);

  return <span ref={node}>{value === null ? "—" : 0}</span>;
}
