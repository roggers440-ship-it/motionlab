'use client';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { categoryById, demoBySlug, neighbours } from '@/demos/registry';
import { loaders } from '@/demos/loaders';
import { PlaygroundProvider, usePlayground } from '@/store/playground';
import { PlaygroundPanel } from '@/components/playground/PlaygroundPanel';
import { cn } from '@/lib/cn';
import { CodeTab } from './CodeTab';
import { HueSetter } from './HueSetter';

const TABS = ['Demo', 'Code', 'Notes'] as const;

function Stage({ slug }: { slug: string }) {
  const meta = demoBySlug.get(slug)!;
  const Demo = loaders[slug];
  const replay = usePlayground((s) => s.replay);
  const webgl = meta.libs.includes('R3F');
  if (meta.layout === 'scroll') return <Demo key={replay} />;
  return (
    <div className="stage h-[min(78vh,760px)] min-h-[520px] w-full" data-webgl={webgl}>
      <Demo key={replay} />
    </div>
  );
}

function Notes({ slug }: { slug: string }) {
  const { notes } = demoBySlug.get(slug)!;
  const items = [
    ['How it works', notes.how],
    ['Performance', notes.perf],
    ['Accessibility & reduced motion', notes.a11y],
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map(([t, body]) => (
        <article key={t} className="rounded-2xl border border-line bg-ink-2/60 p-5">
          <h3 className="eyebrow mb-2 !text-[var(--cat)]">{t}</h3>
          <p className="text-sm leading-relaxed text-dim">{body}</p>
        </article>
      ))}
    </div>
  );
}

export function DemoShell({ slug }: { slug: string }) {
  const meta = demoBySlug.get(slug)!;
  const cat = categoryById.get(meta.category)!;
  const { prev, next } = neighbours(slug);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Demo');
  const wide = useMediaQuery('(min-width: 1024px)');
  // Stage demos on wide screens: dock the playground in a side column.
  // Scroll demos and small screens: floating, draggable, collapsible panel.
  const dock = !!meta.playground && meta.layout === 'stage' && wide;

  return (
    <PlaygroundProvider controls={meta.playground?.controls ?? []}>
      <HueSetter hue={cat.hue} />
      <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-8 md:px-8">
        <nav aria-label="Breadcrumb" className="eyebrow mb-4 flex gap-2">
          <Link href="/" className="hover:text-fg">Lab</Link>/
          <Link href={`/lab/${cat.id}`} className="hover:text-fg">{cat.index} {cat.title}</Link>
        </nav>
        <div className="flex flex-col gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl space-y-3">
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 24 }}
              className="font-display text-4xl font-semibold tracking-tight md:text-6xl">
              {meta.title}
            </motion.h1>
            <p className="text-lg text-dim">{meta.blurb}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className={cn('chip uppercase', meta.depth === 'showcase' && '!border-[var(--cat)] !text-[var(--cat)]')}>
                {meta.depth === 'showcase' ? '★ showcase' : 'sketch'}
              </span>
              {meta.libs.map((l) => <span key={l} className="chip">{l}</span>)}
            </div>
          </div>
          <div role="tablist" aria-label="View" className="relative isolate flex rounded-full border border-line-2 p-1 md:ml-auto">
            {TABS.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={cn('relative rounded-full px-4 py-1.5 text-sm transition-colors', tab === t ? 'text-ink' : 'text-dim hover:text-fg')}>
                {tab === t && <motion.span layoutId="demo-tab" className="absolute inset-0 -z-10 rounded-full bg-[var(--cat)]" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cn(meta.layout === 'stage' || tab !== 'Demo' ? 'mx-auto max-w-[1400px] px-4 md:px-8' : '')}>
        {tab === 'Demo' && (
          <div className={cn(dock && 'grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]')}>
            <Stage slug={slug} />
            {dock && <PlaygroundPanel meta={meta} docked />}
          </div>
        )}
        {tab === 'Code' && <CodeTab slug={slug} />}
        {tab === 'Notes' && <Notes slug={slug} />}
      </div>

      <div className="mx-auto max-w-[1400px] space-y-10 px-4 py-12 md:px-8">
        {tab === 'Demo' && <Notes slug={slug} />}
        <nav aria-label="More demos" className="grid gap-3 sm:grid-cols-2">
          {[['← Previous', prev], ['Next →', next]].map(([label, d]) => {
            const m = d as typeof prev;
            return (
              <Link key={m.slug} href={`/lab/${m.category}/${m.slug}`}
                className="group rounded-2xl border border-line p-5 transition-colors hover:border-line-2 hover:bg-white/[0.03] last:sm:text-right">
                <span className="eyebrow">{label as string}</span>
                <span className="mt-1 block font-display text-xl transition-transform duration-300 group-hover:translate-x-1">{m.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      {meta.playground && tab === 'Demo' && !dock && <PlaygroundPanel meta={meta} />}
    </PlaygroundProvider>
  );
}
