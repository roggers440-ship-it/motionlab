"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { categories } from "@/demos/registry";
import { useUI, selectTier, type ReducedOverride, type Tier } from "@/store/ui";
import { cn } from "@/lib/cn";
import { LogoMark } from "./Logo";

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { v: T; l: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="relative isolate flex rounded-full border border-line-2 p-0.5 text-xs"
    >
      {options.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "relative z-10 rounded-full px-2.5 py-1 transition-colors",
            value === o.v ? "text-ink" : "text-dim hover:text-fg",
          )}
        >
          {value === o.v && (
            <motion.span
              layoutId={`seg-${label}`}
              className="absolute inset-0 -z-10 rounded-full bg-[var(--cat)]"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
          )}
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Settings() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = useUI();
  const tier = useUI(selectTier);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === "Escape"
          : !ref.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        className="btn !px-3"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path
            d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"
            strokeLinecap="round"
          />
          <circle cx="16" cy="6" r="2" />
          <circle cx="10" cy="12" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
        <span className="hidden sm:inline">Motion settings</span>
        <span className="chip !py-0 uppercase">{tier}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Motion settings"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            className="glass absolute right-0 top-[calc(100%+10px)] w-[min(92vw,340px)] origin-top-right space-y-4 rounded-2xl p-4 shadow-2xl"
          >
            <div className="space-y-2">
              <p className="eyebrow">Reduced motion</p>
              <Segmented<ReducedOverride>
                label="Reduced motion"
                value={s.reducedOverride}
                onChange={s.setReducedOverride}
                options={[
                  { v: "system", l: `System (${s.osReduced ? "on" : "off"})` },
                  { v: "on", l: "On" },
                  { v: "off", l: "Off" },
                ]}
              />
              <p className="text-xs text-mute">
                Preview exactly what reduced-motion visitors see. Every demo has
                a reduced path.
              </p>
            </div>
            <div className="space-y-2">
              <p className="eyebrow">Quality tier</p>
              <Segmented<"auto" | Tier>
                label="Quality tier"
                value={s.tierOverride}
                onChange={s.setTierOverride}
                options={[
                  { v: "auto", l: `Auto (${s.detectedTier})` },
                  { v: "high", l: "High" },
                  { v: "mid", l: "Mid" },
                  { v: "low", l: "Low" },
                ]}
              />
              <p className="truncate text-xs text-mute" title={s.gpu}>
                GPU: {s.gpu}
              </p>
            </div>
            <label className="flex items-center justify-between text-sm">
              <span>Performance HUD</span>
              <input
                type="checkbox"
                checked={s.hud}
                onChange={s.toggleHud}
                className="size-4 accent-[var(--cat)]"
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight"
        >
          <LogoMark />
          MotionLab
        </Link>
        <nav
          aria-label="Sections"
          className="mx-auto hidden items-center gap-1 lg:flex"
        >
          {categories.map((c) => {
            const active = path.startsWith(`/lab/${c.id}`);
            return (
              <Link
                key={c.id}
                href={`/lab/${c.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3 py-1.5 text-sm transition-colors",
                  active ? "text-fg" : "text-dim hover:text-fg",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-white/[0.07]"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                {/* <span className="mr-1.5 font-mono text-[10px] text-mute">{c.index}</span> */}
                {c.title}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto lg:ml-0">
          <Settings />
        </div>
      </div>
      <nav
        aria-label="Sections"
        className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden [scrollbar-width:none]"
      >
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/lab/${c.id}`}
            className={cn(
              "chip !text-xs",
              path.startsWith(`/lab/${c.id}`) &&
                "!border-[var(--cat)] !text-fg",
            )}
          >
            {c.index} {c.title}
          </Link>
        ))}
      </nav>
    </header>
  );
}
