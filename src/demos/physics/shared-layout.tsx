'use client';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSpringControls } from '@/store/playground';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useScrollLock } from '@/hooks/useScrollLock';

type Item = { id: string; title: string; img: string; tag: string; body: string };
const ITEMS: Item[] = [
  { id: 'a', title: 'Aurora Fields', img: '/images/art-1.jpg', tag: 'Generative', body: 'Domain-warped value noise mapped through a four-stop palette. Generated at build time by scripts/gen_assets.py — no stock imagery.' },
  { id: 'b', title: 'Tidal Glass', img: '/images/art-2.jpg', tag: 'Texture', body: 'The card, image and title each carry a layoutId. Motion measures the start and end boxes and animates the difference as transforms.' },
  { id: 'c', title: 'Ember Drift', img: '/images/art-3.jpg', tag: 'Palette', body: 'Border radius is scale-corrected during the morph so corners never squash — that is the detail that makes it feel physical.' },
  { id: 'd', title: 'Violet Hour', img: '/images/art-4.jpg', tag: 'Study', body: 'Focus is trapped in the dialog, Esc closes it, and focus returns to the card that opened it.' },
];

function Dialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const spring = useSpringControls({ stiffness: 320, damping: 32, mass: 1 });
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, true, onClose);
  useScrollLock(true);
  // portal: the demo stage uses `contain: paint`, which would trap position:fixed
  return createPortal(
    <>
      <motion.div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 z-[61] grid place-items-center p-4 md:p-12">
        <motion.article ref={ref} layoutId={`card-${item.id}`} transition={spring} role="dialog" aria-modal="true" aria-labelledby={`t-${item.id}`}
          style={{ borderRadius: 28 }}
          className="pointer-events-auto flex max-h-full w-full max-w-3xl flex-col overflow-hidden bg-ink-3 shadow-2xl ring-1 ring-white/10">
          <motion.img layoutId={`img-${item.id}`} transition={spring} src={item.img} alt="" className="h-[45vh] w-full object-cover" />
          <div className="space-y-3 p-6 md:p-8">
            <motion.h3 layoutId={`title-${item.id}`} layout="position" transition={spring} id={`t-${item.id}`} className="font-display text-3xl font-semibold md:text-4xl">
              {item.title}
            </motion.h3>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.12 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="space-y-4">
              <span className="chip">{item.tag}</span>
              <p className="text-dim">{item.body}</p>
              <button onClick={onClose} className="btn">Close (Esc)</button>
            </motion.div>
          </div>
        </motion.article>
      </div>
    </>,
    document.body,
  );
}

export default function SharedLayout() {
  const [active, setActive] = useState<Item | null>(null);
  const spring = useSpringControls({ stiffness: 320, damping: 32, mass: 1 });
  const close = useCallback(() => setActive(null), []);

  return (
    <LayoutGroup>
      <div className="grid h-full content-center gap-4 overflow-auto p-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((it) => (
          <motion.button key={it.id} layoutId={`card-${it.id}`} transition={spring} onClick={() => setActive(it)}
            style={{ borderRadius: 20 }}
            className="group overflow-hidden bg-ink-3 text-left ring-1 ring-white/10" aria-haspopup="dialog">
            <motion.img layoutId={`img-${it.id}`} transition={spring} src={it.img} alt="" className="h-44 w-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
            <div className="p-4">
              <motion.h3 layoutId={`title-${it.id}`} layout="position" transition={spring} className="font-display text-lg font-semibold">
                {it.title}
              </motion.h3>
              <p className="text-xs text-dim">{it.tag}</p>
            </div>
          </motion.button>
        ))}
      </div>
      <AnimatePresence>{active && <Dialog key={active.id} item={active} onClose={close} />}</AnimatePresence>
    </LayoutGroup>
  );
}
