'use client';
import Link from 'next/link';
import { motion } from 'motion/react';
import type { DemoMeta } from '@/demos/types';
import { categoryById } from '@/demos/registry';

// deterministic pseudo-random from the slug → unique card art per demo
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

export function DemoCard({ d, i = 0 }: { d: DemoMeta; i?: number }) {
  const cat = categoryById.get(d.category)!;
  const r = hash(d.slug);
  const hue = cat.hue + (r - 0.5) * 50;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 220, damping: 26, delay: (i % 4) * 0.05 }}
    >
      <Link
        href={`/lab/${d.category}/${d.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-ink-2/70 transition-colors hover:border-line-2"
        onPointerMove={(e) => {
          const b = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty('--mx', `${e.clientX - b.left}px`);
          e.currentTarget.style.setProperty('--my', `${e.clientY - b.top}px`);
        }}
      >
        {/* cursor spotlight — CSS vars only, no React state */}
        <span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `radial-gradient(360px circle at var(--mx) var(--my), oklch(0.75 0.17 ${hue} / 0.12), transparent 60%)` }} />
        <div aria-hidden className="relative h-32 overflow-hidden border-b border-line"
          style={{ background: `radial-gradient(120% 140% at ${20 + r * 60}% 0%, oklch(0.55 0.2 ${hue} / 0.55), transparent 60%), linear-gradient(135deg, oklch(0.2 0.05 ${hue}), oklch(0.12 0.03 ${hue + 40}))` }}>
          <svg viewBox="0 0 200 100" className="absolute inset-0 h-full w-full opacity-60 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110 group-hover:rotate-2">
            {Array.from({ length: 6 }).map((_, k) => (
              <circle key={k} cx={30 + ((r * 997 * (k + 1)) % 150)} cy={20 + ((r * 541 * (k + 3)) % 60)} r={4 + ((r * 97 * (k + 1)) % 22)}
                fill="none" stroke={`oklch(0.85 0.15 ${hue + k * 12})`} strokeWidth="1" />
            ))}
          </svg>
          <span className="absolute bottom-2 right-3 font-display text-5xl font-bold text-white/10">{cat.index}</span>
          {d.depth === 'showcase' && <span className="chip absolute left-3 top-3 !border-white/20 bg-black/30 !text-white">★ showcase</span>}
        </div>
        <div className="relative flex flex-1 flex-col gap-2 p-4">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold leading-tight">
            {d.title}
            <span className="ml-auto -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden>→</span>
          </h3>
          <p className="line-clamp-2 text-sm text-dim">{d.blurb}</p>
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            {d.libs.slice(0, 4).map((l) => <span key={l} className="chip !text-[10px]">{l}</span>)}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
