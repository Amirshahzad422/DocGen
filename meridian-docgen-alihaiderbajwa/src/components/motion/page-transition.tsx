"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(root);

    mm.add(
      { reduceMotion: "(prefers-reduced-motion: reduce)" },
      (context) => {
        if (context.conditions?.reduceMotion) {
          gsap.set(":scope > *", { clearProps: "all" });
          return;
        }

        gsap.fromTo(
          ":scope > *",
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.055,
            ease: "power3.out",
            clearProps: "transform,opacity,visibility",
          },
        );
      },
    );

    return () => mm.revert();
  }, [pathname]);

  return (
    <div ref={root} key={pathname} className="mx-auto w-full max-w-[100rem]">
      {children}
    </div>
  );
}
