'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { demos } from '@/demos/registry';
import { useSpringControls } from '@/store/playground';
import { useScrollLock } from '@/hooks/useScrollLock';

function Palette({ onClose }: { onClose: () => void }) {
  const spring = useSpringControls({ stiffness: 500, damping: 38, mass: 1 });
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  useScrollLock(true);
  const results = useMemo(
    () => demos.filter((d) => `${d.title} ${d.category} ${d.libs.join(' ')}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8),
    [q],
  );
  useEffect(() => setActive(0), [q]);
  useEffect(() => input.current?.focus(), []);

  const go = (i: number) => {
    const d = results[i];
    if (!d) return;
    onClose();
    router.push(`/lab/${d.category}/${d.slug}`);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === 'Enter') go(active);
    if (e.key === 'Escape') onClose();
  };

  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="pointer-events-none fixed inset-x-0 top-[12vh] z-[61] flex justify-center px-4">
        {/* same layoutId as the trigger → the palette grows out of the button */}
        <motion.div layoutId="cmdk" transition={spring} style={{ borderRadius: 22 }} role="dialog" aria-modal="true" aria-label="Command palette"
          className="pointer-events-auto w-full max-w-xl overflow-hidden bg-ink-3 shadow-2xl ring-1 ring-white/10">
          <motion.div layout="position" className="flex items-center gap-3 border-b border-line px-4">
            <span aria-hidden className="text-mute">⌘</span>
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
              role="combobox" aria-expanded aria-controls={listId} aria-activedescendant={results[active] ? `opt-${results[active].slug}` : undefined}
              placeholder="Jump to a demo…" className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-mute" />
            <kbd className="chip">esc</kbd>
          </motion.div>
          <motion.ul id={listId} role="listbox" layout className="max-h-[50vh] overflow-y-auto p-2" data-lenis-prevent
            initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.08 } }}>
            <AnimatePresence mode="popLayout" initial={false}>
              {results.map((d, i) => (
                <motion.li layout key={d.slug} id={`opt-${d.slug}`} role="option" aria-selected={i === active}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={spring}
                  onMouseEnter={() => setActive(i)} onClick={() => go(i)}
                  className="relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm">
                  {/* one highlight element that slides between rows */}
                  {i === active && <motion.span layoutId="cmdk-hl" transition={spring} className="absolute inset-0 -z-10 rounded-xl bg-white/[0.07]" />}
                  <span className="font-mono text-[10px] uppercase text-mute">{d.category}</span>
                  <span className="flex-1">{d.title}</span>
                  {i === active && <span className="text-mute">↵</span>}
                </motion.li>
              ))}
            </AnimatePresence>
            {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-dim">No matches for “{q}”.</li>}
          </motion.ul>
        </motion.div>
      </div>
    </>
  );
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const spring = useSpringControls({ stiffness: 500, damping: 38, mass: 1 });
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  return (
    <div className="grid h-full place-items-center p-6">
      <div className="space-y-6 text-center">
        <AnimatePresence initial={false}>
          {!open && (
            <motion.button layoutId="cmdk" transition={spring} onClick={() => setOpen(true)} style={{ borderRadius: 22 }}
              className="inline-flex items-center gap-3 bg-ink-3 px-5 py-3 text-dim ring-1 ring-white/10 hover:text-fg">
              <motion.span layout="position">Search demos…</motion.span>
              <motion.kbd layout="position" className="chip">⌘K</motion.kbd>
            </motion.button>
          )}
        </AnimatePresence>
        <p className="text-sm text-mute">Press ⌘K / Ctrl+K or click. Arrow keys + Enter navigate for real.</p>
      </div>
      {typeof document !== 'undefined' && createPortal(<AnimatePresence>{open && <Palette onClose={close} />}</AnimatePresence>, document.body)}
    </div>
  );
}
