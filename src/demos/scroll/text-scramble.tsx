"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useControl } from "@/store/playground";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const PHRASES = [
  "Decode the web.",
  "नमस्ते, संसार।",
  "Motion is meaning.",
  "Ship at 60fps.",
];
const WORDS = [
  "ScrollTrigger",
  "SplitText",
  "MorphSVG",
  "DrawSVG",
  "Observer",
  "Flip",
];

export default function TextScramble() {
  const root = useRef<HTMLDivElement>(null);
  const duration = useControl("duration", 1.2);
  const chars = useControl("chars", "upperCase");
  const speed = useControl("speed", 0.6);
  const reduced = useReducedMotion();

  const { contextSafe } = useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      if (reduced) return;
      // looping headline
      const tl = gsap.timeline({ repeat: -1 });
      PHRASES.forEach((p) =>
        tl
          .to(q(".headline"), {
            duration,
            scrambleText: { text: p, chars, speed, revealDelay: 0.2 },
          })
          .to({}, { duration: 1.4 }),
      );
      // on-load decode for the grid
      q(".word").forEach((el, i) =>
        gsap.from(el, {
          duration: duration * 1.2,
          delay: i * 0.08,
          scrambleText: { text: "", chars, speed },
          ease: "none",
        }),
      );
    },
    {
      scope: root,
      dependencies: [duration, chars, speed, reduced],
      revertOnUpdate: true,
    },
  );

  const hover = contextSafe((e: React.PointerEvent<HTMLElement>) => {
    if (reduced) return;
    const el = e.currentTarget;
    gsap.to(el, {
      duration: duration * 0.7,
      scrambleText: { text: el.dataset.text!, chars, speed },
      overwrite: true,
    });
  });

  return (
    <div
      ref={root}
      className="flex h-full flex-col items-center justify-center gap-12 p-6"
    >
      <p
        aria-live="off"
        aria-label={PHRASES[0]}
        className="headline min-h-[1.2em] text-center font-mono text-4xl font-semibold text-[var(--cat)] md:text-6xl"
      >
        {PHRASES[0]}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {WORDS.map((w) => (
          <button
            key={w}
            data-text={w}
            aria-label={w}
            onPointerEnter={hover}
            onFocus={(e) =>
              hover(e as unknown as React.PointerEvent<HTMLElement>)
            }
            className="word w-56 rounded-xl border border-line px-5 py-4 text-left font-mono text-lg hover:border-[var(--cat)]"
          >
            {w}
          </button>
        ))}
      </div>
      <p className="text-sm text-mute">Hover a word to re-decode it.</p>
    </div>
  );
}
