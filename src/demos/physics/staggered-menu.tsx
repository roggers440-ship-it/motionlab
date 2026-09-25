'use client';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { useControl, useSpringControls } from '@/store/playground';
import { useFocusTrap } from '@/hooks/useFocusTrap';

const LINKS = ['Work', 'Playground', 'Writing', 'About', 'Contact'];

export default function StaggeredMenu() {
  const [open, setOpen] = useState(false);
  const spring = useSpringControls({ stiffness: 260, damping: 24, mass: 1 });
  const stagger = useControl('stagger', 0.06);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useFocusTrap(panel, open, close);

  const list: Variants = {
    open: { transition: { staggerChildren: stagger, delayChildren: 0.15 } },
    closed: { transition: { staggerChildren: stagger / 2, staggerDirection: -1 } },
  };
  const item: Variants = {
    open: { y: 0, opacity: 1, rotate: 0, transition: spring },
    closed: { y: 40, opacity: 0, rotate: 4, transition: { duration: 0.15 } },
  };

  return (
    <div className="grid h-full place-items-center p-6">
      {/* mock phone so the menu is contained inside the stage */}
      <div className="relative h-[600px] max-h-full w-[320px] overflow-hidden rounded-[40px] border-[6px] border-ink-3 bg-[url(/images/art-4.jpg)] bg-cover bg-center shadow-2xl">
        <div className="flex items-center justify-between p-5">
          <span className="font-display font-semibold text-white">studio®</span>
          <button ref={toggle} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)} className="relative z-20 grid size-11 place-items-center rounded-full bg-white/90 text-ink">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
              <motion.line x1="3" x2="17" y1="6" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }} transition={spring} style={{ originX: '50%', originY: '50%' }} />
              <motion.line x1="3" x2="17" y1="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" animate={open ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }} transition={spring} style={{ originX: '50%', originY: '50%' }} />
            </svg>
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <>
              {/* blur layer only exists while open: backdrop-filter is expensive */}
              <motion.div className="absolute inset-0 z-0 bg-black/30 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
              <motion.nav id="mobile-menu" ref={panel} aria-label="Main"
                initial={{ clipPath: 'circle(0px at calc(100% - 42px) 42px)' }}
                animate={{ clipPath: 'circle(900px at calc(100% - 42px) 42px)', transition: { type: 'spring', stiffness: 40, damping: 12 } }}
                exit={{ clipPath: 'circle(0px at calc(100% - 42px) 42px)', transition: { delay: 0.2, duration: 0.35, ease: [0.7, 0, 0.84, 0] } }}
                className="absolute inset-0 z-10 flex flex-col justify-center bg-ink/90 px-8">
                <motion.ul variants={list} initial="closed" animate="open" exit="closed" className="space-y-2">
                  {LINKS.map((l) => (
                    <motion.li key={l} variants={item} style={{ originX: 0 }}>
                      <a href="#" onClick={(e) => { e.preventDefault(); close(); }} className="block font-display text-5xl font-semibold text-white hover:text-[var(--cat)]">
                        {l}
                      </a>
                    </motion.li>
                  ))}
                </motion.ul>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.5 } }} exit={{ opacity: 0 }} className="mt-10 text-sm text-dim">hello@studio.example</motion.p>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
        {!open && <p className="absolute bottom-6 left-6 right-6 font-display text-4xl font-semibold leading-tight text-white">Tap the menu ↗</p>}
      </div>
    </div>
  );
}
