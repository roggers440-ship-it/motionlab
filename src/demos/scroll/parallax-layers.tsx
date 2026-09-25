"use client";
import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useControl } from "@/store/playground";
import {
  ScrollIntro,
  ScrollOutro,
  useScrollSettings,
} from "@/components/shell/ScrollBits";

// Himalayan ridge: a few sharp triangular peaks + small jagged noise.
// Deterministic (seeded) so server and client draw the same mountains.
function ridge(seed: number, base: number, amp: number, peaks: number) {
  let r = seed * 9301;
  const rand = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const tops = Array.from({ length: peaks }, () => ({
    x: rand() * 1600,
    h: 0.45 + rand() * 0.55,
    w: 180 + rand() * 260,
  }));
  const pts: string[] = ["0,400"];
  for (let x = 0; x <= 1600; x += 10) {
    let hgt = 0;
    for (const t of tops)
      hgt = Math.max(hgt, t.h * Math.max(0, 1 - Math.abs(x - t.x) / t.w)); // triangle peaks
    hgt += (rand() - 0.5) * 0.03; // rocky jaggedness
    pts.push(`${x},${(base - hgt * amp).toFixed(1)}`);
  }
  pts.push("1600,400");
  return pts.join(" ");
}

const LAYERS = [
  // back range: snow-lit peaks catching the sunrise
  {
    speed: 0.1,
    seed: 3,
    base: 300,
    amp: 260,
    peaks: 6,
    color: "oklch(0.9 0.04 40)",
  },
  {
    speed: 0.25,
    seed: 7,
    base: 310,
    amp: 190,
    peaks: 7,
    color: "oklch(0.55 0.08 300)",
  },
  {
    speed: 0.45,
    seed: 11,
    base: 330,
    amp: 140,
    peaks: 8,
    color: "oklch(0.36 0.08 295)",
  },
  {
    speed: 0.7,
    seed: 17,
    base: 360,
    amp: 90,
    peaks: 9,
    color: "oklch(0.22 0.06 290)",
  },
  {
    speed: 1,
    seed: 23,
    base: 390,
    amp: 45,
    peaks: 12,
    color: "oklch(0.12 0.04 285)",
  },
];

export default function ParallaxLayers() {
  const scene = useRef<HTMLElement>(null);
  const { scrub, markers, reduced, deps } = useScrollSettings(0);
  const depth = useControl("depth", 1);
  const shapes = useMemo(
    () => LAYERS.map((l) => ridge(l.seed, l.base, l.amp, l.peaks)),
    [],
  );

  useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(scene);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scene.current,
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub,
          markers,
        },
        defaults: { ease: "none" },
      });
      // each layer moves up proportionally to its speed → depth
      q("[data-speed]").forEach((el) => {
        const s = Number((el as HTMLElement).dataset.speed) * depth;
        tl.to(el, { yPercent: -s * 45 }, 0);
      });
      tl.to(q(".sun"), { yPercent: 60, scale: 0.8 }, 0)
        .to(q(".sky"), { opacity: 0.35 }, 0)
        .fromTo(
          q(".title"),
          { yPercent: 0 },
          { yPercent: -120 * depth, opacity: 0 },
          0,
        );
      // promote layers only while the scene is active
      gsap.set(q("[data-speed]"), { willChange: "transform" });
    },
    { scope: scene, dependencies: [...deps, depth], revertOnUpdate: true },
  );

  return (
    <>
      <ScrollIntro title="Sunrise over the Himalaya.">
        Five mountain ranges, five scroll speeds: distant peaks drift, the
        foothills rush past.
      </ScrollIntro>
      <section ref={scene} className="relative h-screen overflow-hidden">
        <div className="sky absolute inset-0 bg-gradient-to-b from-[#1b1045] via-[#6a2a6e] to-[#ff8a5c]" />
        <div className="sun absolute left-1/2 top-[18%] size-[26vmin] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ffe9a8] to-[#ff7a59] shadow-[0_0_120px_40px_rgba(255,140,90,.45)]" />
        <h3
          className="title absolute inset-x-0 top-[30%] text-center font-display text-[12vw] font-bold leading-none text-white/90 mix-blend-overlay"
          lang="ne"
        >
          हिमाल
        </h3>
        {LAYERS.map((l, i) => (
          <svg
            key={i}
            data-speed={l.speed}
            viewBox="0 0 1600 400"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-[-12%] h-[70%] w-full"
            aria-hidden
          >
            <polygon points={shapes[i]} fill={l.color} />
          </svg>
        ))}
      </section>
      <ScrollOutro />
    </>
  );
}
