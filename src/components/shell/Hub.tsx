'use client';
import Link from 'next/link';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { allLibs, categories, demos, demosIn } from '@/demos/registry';
import type { Lib } from '@/demos/types';
import { cn } from '@/lib/cn';
import { DemoCard } from './DemoCard';
import { HueSetter } from './HueSetter';

const WORD = 'MotionLab';

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const showcase = demos.filter((d) => d.depth === 'showcase').length;

  return (
    <section ref={ref} className="relative overflow-hidden px-4 pb-16 pt-20 md:px-8 md:pt-28">
      {/* ambient orbs: pure CSS keyframes on transforms */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {[
          ['#ff6ec7', '10%', '10%', 22],
          ['#7c5cff', '60%', '0%', 28],
          ['#38e1c6', '80%', '50%', 34],
        ].map(([c, l, t, s], k) => (
          <span key={k} className="absolute size-[38vw] max-w-[520px] rounded-full opacity-25 blur-3xl"
            style={{ background: c as string, left: l as string, top: t as string, animation: `ml-orbit ${s}s ease-in-out infinite alternate` }} />
        ))}
      </div>
      <motion.div style={{ y, opacity }} className="mx-auto max-w-[1400px]">
        <p className="eyebrow mb-6">A production-grade web animation lab</p>
        <h1 aria-label={WORD} className="font-display text-[clamp(3.5rem,14vw,12rem)] font-bold leading-[0.85] tracking-[-0.04em]">
          {WORD.split('').map((ch, i) => (
            <motion.span key={i} aria-hidden className="inline-block"
              initial={{ y: '110%', rotate: 8, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }}
              whileHover={{ y: -14, color: 'var(--cat)', transition: { type: 'spring', stiffness: 600, damping: 12 } }}
              transition={{ type: 'spring', stiffness: 170, damping: 16, delay: 0.1 + i * 0.045 }}>
              {ch}
            </motion.span>
          ))}
        </h1>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, type: 'spring', stiffness: 120, damping: 20 }}
          className="mt-8 grid max-w-5xl gap-8 md:grid-cols-[1.4fr_1fr]">
          <p className="text-lg leading-relaxed text-dim md:text-xl">
            UI physics, scroll-driven timelines, shared-canvas WebGL, vector state machines, shaders, simulations and native web motion. Every demo ships with
            <span className="text-fg"> live playground controls</span>, a <span className="text-fg">perf HUD</span>, its <span className="text-fg">source</span>, and a
            <span className="text-fg"> reduced-motion path</span>.
          </p>
          <dl className="grid grid-cols-3 gap-4 self-end">
            {[[demos.length, 'demos'], [showcase, 'showcases'], [1, 'WebGL context']].map(([n, l]) => (
              <div key={l as string} className="border-l border-line-2 pl-3">
                <dt className="eyebrow">{l}</dt>
                <dd className="font-display text-3xl font-semibold tabular-nums">{n}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="#sections" className="btn btn-primary">Explore the lab ↓</Link>
          <Link href="/lab/native/four-engines" className="btn">Same effect, 4 engines →</Link>
        </div>
      </motion.div>
    </section>
  );
}

export function Hub() {
  const [lib, setLib] = useState<Lib | 'All'>('All');
  const [q, setQ] = useState('');
  const [showcaseOnly, setShowcaseOnly] = useState(false);
  const filtered = useMemo(
    () =>
      demos.filter(
        (d) =>
          (lib === 'All' || d.libs.includes(lib)) &&
          (!showcaseOnly || d.depth === 'showcase') &&
          (!q || `${d.title} ${d.blurb} ${d.libs.join(' ')}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [lib, q, showcaseOnly],
  );
  const filtering = lib !== 'All' || q || showcaseOnly;

  return (
    <>
      <HueSetter hue={320} />
      <Hero />
      <section id="sections" className="mx-auto max-w-[1400px] scroll-mt-24 px-4 pb-24 md:px-8">
        <div className="glass sticky top-[72px] z-30 -mx-2 mb-10 flex flex-wrap items-center gap-2 rounded-2xl p-2 lg:top-20">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search demos…" aria-label="Search demos"
            className="min-w-[180px] flex-1 rounded-full border border-line-2 bg-transparent px-4 py-1.5 text-sm outline-none focus:border-[var(--cat)]" />
          <button className={cn('chip', showcaseOnly && '!border-[var(--cat)] !text-fg')} aria-pressed={showcaseOnly} onClick={() => setShowcaseOnly((s) => !s)}>★ showcase</button>
          <div className="flex max-w-full gap-1 overflow-x-auto [scrollbar-width:none]" data-lenis-prevent>
            {(['All', ...allLibs] as const).map((l) => (
              <button key={l} onClick={() => setLib(l)} aria-pressed={lib === l}
                className={cn('chip', lib === l && '!border-[var(--cat)] !bg-[var(--cat-soft)] !text-fg')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {filtering ? (
            <motion.div key="flat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="eyebrow mb-4">{filtered.length} result{filtered.length === 1 ? '' : 's'}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filtered.map((d, i) => <DemoCard key={d.slug} d={d} i={i} />)}
              </div>
            </motion.div>
          ) : (
            <motion.div key="sections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-20">
              {categories.map((c) => (
                <section key={c.id} aria-labelledby={`h-${c.id}`} style={{ '--hue': c.hue } as React.CSSProperties}>
                  <div className="mb-6 flex flex-wrap items-end gap-4 border-b border-line pb-4">
                    <span className="font-display text-6xl font-bold text-[var(--cat)] opacity-80">{c.index}</span>
                    <div>
                      <h2 id={`h-${c.id}`} className="font-display text-3xl font-semibold">{c.title}</h2>
                      <p className="text-dim">{c.tagline}</p>
                    </div>
                    <Link href={`/lab/${c.id}`} className="btn ml-auto">All {demosIn(c.id).length} →</Link>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {demosIn(c.id).map((d, i) => <DemoCard key={d.slug} d={d} i={i} />)}
                  </div>
                </section>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      <footer className="border-t border-line px-4 py-10 text-center text-sm text-mute md:px-8">
        MotionLab · Next.js · Motion · GSAP · Lenis · React Three Fiber · Rive · Lottie — all media procedurally generated.
      </footer>
    </>
  );
}
