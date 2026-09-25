'use client';
import { useMemo, useState } from 'react';
import { usePlayground } from '@/store/playground';
import { bezierExports, springExports, uniformExports } from '@/lib/spring';
import type { PlaygroundKind } from '@/demos/types';
import { cn } from '@/lib/cn';

export function ExportMenu({ kind }: { kind: PlaygroundKind }) {
  const v = usePlayground((s) => s.values);
  const tabs = useMemo(() => {
    if (kind === 'spring') {
      const e = springExports({ stiffness: +v.stiffness, damping: +v.damping, mass: +v.mass, velocity: +v.velocity });
      return { Motion: e.motion, CSS: e.css, GSAP: e.gsap };
    }
    if (kind === 'tween') {
      const e = bezierExports([+v.x1, +v.y1, +v.x2, +v.y2], +v.duration);
      return { Motion: e.motion, CSS: e.css, GSAP: e.gsap };
    }
    const u = uniformExports(v);
    return kind === 'shader' ? { GLSL: u.glsl, JSON: u.json } : { JSON: u.json };
  }, [kind, v]);
  const names = Object.keys(tabs) as (keyof typeof tabs)[];
  const [tab, setTab] = useState<string>(names[0]);
  const active = (names.includes(tab as never) ? tab : names[0]) as keyof typeof tabs;
  const [copied, setCopied] = useState(false);
  const code = tabs[active] as string;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <span className="eyebrow mr-auto">Export</span>
        {names.map((n) => (
          <button key={n} onClick={() => setTab(n)} className={cn('chip !py-0.5', n === active && '!border-[var(--cat)] !text-fg')}>
            {n}
          </button>
        ))}
      </div>
      <div className="relative">
        <pre className="max-h-36 overflow-auto rounded-lg bg-black/40 p-2.5 pr-14 font-mono text-[10.5px] leading-relaxed text-dim" data-lenis-prevent>
          {code}
        </pre>
        <button className="chip absolute right-1.5 top-1.5 bg-ink !text-fg" onClick={async () => {
          await navigator.clipboard?.writeText(code).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
