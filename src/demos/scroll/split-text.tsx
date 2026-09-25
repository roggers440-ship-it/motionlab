"use client";
import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { useControl } from "@/store/playground";
import {
  ScrollIntro,
  ScrollOutro,
  useScrollSettings,
} from "@/components/shell/ScrollBits";

// Devanagari "aksara": consonant (+ virama + consonant)* + vowel signs/marks, or an independent vowel.
// Treating each as ONE char keeps conjuncts like क्ष, त्र, श्र intact when splitting by chars.
const DEVANAGARI_AKSARA =
  /(?:[\u0915-\u0939\u0958-\u095F](?:\u094D[\u0915-\u0939\u0958-\u095F])*|[\u0904-\u0914])[\u093A-\u094F\u0900-\u0903\u0951-\u0957]*/;

const LINES = [
  "Typography is the voice of an interface.",
  "शब्दहरू पनि नाच्छन् — अक्षर-अक्षर टुक्र्याएर।",
  "Split it into lines, words or characters — then choreograph each piece.",
  "Masks hide the overflow so text rises from nowhere.",
];

export default function SplitTextDemo() {
  const root = useRef<HTMLDivElement>(null);
  const { scrub, markers, reduced, deps } = useScrollSettings(0);
  const split = useControl("split", "lines") as "chars" | "words" | "lines";

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      q(".reveal").forEach((el) => {
        SplitText.create(el, {
          type: "lines,words,chars",
          specialChars: DEVANAGARI_AKSARA, // no-op for Latin text
          mask: split === "chars" ? "words" : "lines",
          autoSplit: true, // re-split on resize / font load; the returned tween is reverted automatically
          onSplit(self) {
            const targets = self[split];
            return gsap.from(targets, {
              yPercent: 110,
              opacity: reduced ? 0 : 1,
              rotate: reduced ? 0 : split === "chars" ? 12 : 3,
              stagger:
                split === "chars" ? 0.012 : split === "words" ? 0.03 : 0.1,
              ease: "power4.out",
              duration: reduced ? 0.4 : 1,
              ...(reduced && { yPercent: 0 }),
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                end: "top 45%",
                scrub: scrub === true ? true : scrub,
                markers,
              },
            });
          },
        });
      });

      // skew-on-scroll: velocity → skewY, via one reusable quickTo tween
      if (reduced) return;
      const skewTo = gsap.quickTo(q(".skew"), "skewY", {
        duration: 0.5,
        ease: "power3",
      });
      const clamp = gsap.utils.clamp(-14, 14);
      ScrollTrigger.create({
        trigger: q(".skew-wrap")[0],
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => skewTo(clamp(self.getVelocity() / -250)),
        onLeave: () => skewTo(0),
        onLeaveBack: () => skewTo(0),
      });
    },
    { scope: root, dependencies: [...deps, split], revertOnUpdate: true },
  );

  return (
    <div ref={root}>
      <ScrollIntro title="SplitText reveals">
        Switch between chars / words / lines in the Playground — the split is
        rebuilt and re-animated.
      </ScrollIntro>
      <div className="mx-auto max-w-[1400px] space-y-[30vh] px-4 pb-[20vh] md:px-8">
        {LINES.map((l) => (
          <p
            key={l}
            lang={/[\u0900-\u097F]/.test(l) ? "ne" : undefined}
            className="reveal font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-8xl"
          >
            {l}
          </p>
        ))}
      </div>
      <div className="skew-wrap space-y-2 overflow-hidden py-[20vh]">
        <p className="eyebrow mx-auto max-w-[1400px] px-4 md:px-8">
          Skew by scroll velocity — scroll fast ↕
        </p>
        {["Velocity", "becomes", "skew"].map((w) => (
          <p
            key={w}
            className="skew text-center font-display text-[18vw] font-bold leading-[0.85] text-[var(--cat)] will-change-transform"
          >
            {w}
          </p>
        ))}
      </div>
      <ScrollOutro />
    </div>
  );
}
