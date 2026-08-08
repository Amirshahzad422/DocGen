"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SpotlightCard({
  children,
  className,
  spotlightColor = "color-mix(in oklch, var(--primary) 14%, transparent)",
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  function updateSpotlight(event: PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card || event.pointerType === "touch") return;

    const rect = card.getBoundingClientRect();
    card.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
    card.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
    card.style.setProperty("--spotlight-opacity", "1");
  }

  return (
    <div
      ref={cardRef}
      onPointerMove={updateSpotlight}
      onPointerLeave={() =>
        cardRef.current?.style.setProperty("--spotlight-opacity", "0")
      }
      style={{
        "--spotlight-color": spotlightColor,
      } as React.CSSProperties}
      className={cn(
        "spotlight-card relative overflow-hidden rounded-2xl border bg-card shadow-[0_18px_50px_-34px_color-mix(in_oklch,var(--foreground)_38%,transparent)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
