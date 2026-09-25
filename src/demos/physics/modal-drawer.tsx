'use client';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSpringControls } from '@/store/playground';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useScrollLock } from '@/hooks/useScrollLock';

function Backdrop({ onClick }: { onClick: () => void }) {
  return <motion.div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClick} />;
}

function Modal({ onClose }: { onClose: () => void }) {
  const spring = useSpringControls({ stiffness: 380, damping: 36, mass: 1 });
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, onClose);
  useScrollLock(true);
  return (
    <>
      <Backdrop onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 z-[61] grid place-items-center p-4">
        <motion.div ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-t"
          initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={spring}
          className="pointer-events-auto w-full max-w-md space-y-4 rounded-3xl bg-ink-3 p-7 shadow-2xl ring-1 ring-white/10">
          <h3 id="modal-t" className="font-display text-2xl font-semibold">Delete project?</h3>
          <p className="text-dim">The modal scales from 90% with a spring. Esc, backdrop click and the buttons all close it; focus returns to the trigger.</p>
          <div className="flex justify-end gap-2">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn !bg-[#ff5a6a] !text-ink" onClick={onClose}>Delete</button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function Drawer({ onClose }: { onClose: () => void }) {
  const spring = useSpringControls({ stiffness: 380, damping: 36, mass: 1 });
  const ref = useRef<HTMLDivElement>(null);
  const controls = useDragControls();
  useFocusTrap(ref, true, onClose);
  useScrollLock(true);
  const onDragEnd = (_: unknown, info: PanInfo) => {
    // close if dragged far enough OR flicked down fast enough
    if (info.offset.y > 140 || info.velocity.y > 600) onClose();
  };
  return (
    <>
      <Backdrop onClick={onClose} />
      <motion.div ref={ref} role="dialog" aria-modal="true" aria-label="Share sheet"
        drag="y" dragControls={controls} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.05, bottom: 0.8 }} onDragEnd={onDragEnd}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
        className="fixed inset-x-0 bottom-0 z-[61] mx-auto max-w-lg rounded-t-[28px] bg-ink-3 p-6 pb-10 shadow-2xl ring-1 ring-white/10">
        <div onPointerDown={(e) => controls.start(e)} className="-mt-3 mb-4 flex cursor-grab touch-none justify-center py-3 active:cursor-grabbing">
          <span className="h-1.5 w-12 rounded-full bg-white/25" />
        </div>
        <h3 className="mb-4 font-display text-xl font-semibold">Share</h3>
        <div className="grid grid-cols-4 gap-3">
          {['Copy link', 'Email', 'Message', 'More'].map((l, i) => (
            <motion.button key={l} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.04 } }} onClick={onClose}
              className="flex flex-col items-center gap-2 rounded-2xl p-3 text-xs text-dim hover:bg-white/5">
              <span className="size-12 rounded-2xl" style={{ background: `oklch(0.7 0.16 ${200 + i * 40})` }} />
              {l}
            </motion.button>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-mute">Drag the handle down or flick to dismiss.</p>
      </motion.div>
    </>
  );
}

export default function ModalDrawer() {
  const [which, setWhich] = useState<'modal' | 'drawer' | null>(null);
  const close = useCallback(() => setWhich(null), []);
  return (
    <div className="flex h-full flex-wrap items-center justify-center gap-4 p-6">
      <button className="btn btn-primary !px-6 !py-3" onClick={() => setWhich('modal')} aria-haspopup="dialog">Open modal</button>
      <button className="btn !px-6 !py-3" onClick={() => setWhich('drawer')} aria-haspopup="dialog">Open bottom sheet</button>
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {which === 'modal' && <Modal key="m" onClose={close} />}
            {which === 'drawer' && <Drawer key="d" onClose={close} />}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
