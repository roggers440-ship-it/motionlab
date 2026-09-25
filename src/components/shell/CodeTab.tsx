'use client';
import { useEffect, useState } from 'react';
import { highlight } from 'sugar-high';

/** Loads the demo's real source (copied to /public/sources at build) on demand. */
export function CodeTab({ slug }: { slug: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [raw, setRaw] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(`/sources/${slug}.txt`)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((t) => {
        if (!alive) return;
        setRaw(t);
        setHtml(highlight(t));
      })
      .catch(() => alive && setHtml('<span>// Source not generated — run `npm run gen:sources`.</span>'));
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-ink-2">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="font-mono text-xs text-dim">src/demos/…/{slug}.tsx</span>
        <button className="chip ml-auto !text-fg" onClick={async () => {
          await navigator.clipboard?.writeText(raw).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}>
          {copied ? 'Copied' : 'Copy source'}
        </button>
      </div>
      <pre className="code max-h-[75vh] overflow-auto p-4 font-mono text-[12.5px] leading-[1.65]" data-lenis-prevent>
        {html === null ? <span className="text-mute">Loading…</span> : <code dangerouslySetInnerHTML={{ __html: html }} />}
      </pre>
    </div>
  );
}
