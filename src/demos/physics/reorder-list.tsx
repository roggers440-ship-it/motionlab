'use client';
import { AnimatePresence, Reorder, motion, useDragControls } from 'motion/react';
import { useState } from 'react';
import { useSpringControls } from '@/store/playground';

type Task = { id: number; text: string; hue: number };
const SEED = ['Measure first, animate second', 'Transforms & opacity only', 'Respect reduced motion', 'One rAF loop to rule them all', 'Kill tweens on unmount'];
let uid = 100;

function Row({ t, i, n, move, remove }: { t: Task; i: number; n: number; move: (i: number, d: number) => void; remove: () => void }) {
  const spring = useSpringControls({ stiffness: 500, damping: 40, mass: 1 });
  const controls = useDragControls();
  return (
    <Reorder.Item value={t} dragListener={false} dragControls={controls} transition={spring}
      initial={{ opacity: 0, scale: 0.9, y: -12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, x: 40 }}
      whileDrag={{ scale: 1.03, boxShadow: '0 20px 40px -12px rgba(0,0,0,.6)' }}
      className="flex items-center gap-3 rounded-xl border border-line bg-ink-3 p-3" style={{ position: 'relative' }}>
      <button aria-label="Drag to reorder" onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none px-1 text-mute active:cursor-grabbing">⋮⋮</button>
      <span className="size-2.5 rounded-full" style={{ background: `oklch(0.75 0.17 ${t.hue})` }} />
      <span className="flex-1 text-sm">{t.text}</span>
      <button className="chip" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move “${t.text}” up`}>↑</button>
      <button className="chip" disabled={i === n - 1} onClick={() => move(i, 1)} aria-label={`Move “${t.text}” down`}>↓</button>
      <button className="chip hover:!text-fg" onClick={remove} aria-label={`Remove “${t.text}”`}>✕</button>
    </Reorder.Item>
  );
}

export default function ReorderList() {
  const [items, setItems] = useState<Task[]>(SEED.map((text, i) => ({ id: i, text, hue: 200 + i * 30 })));
  const move = (i: number, d: number) => setItems((arr) => {
    const a = [...arr];
    [a[i], a[i + d]] = [a[i + d], a[i]];
    return a;
  });
  const add = () => setItems((a) => [{ id: ++uid, text: `New task #${uid - 100}`, hue: Math.random() * 360 }, ...a]);
  const shuffle = () => setItems((a) => [...a].sort(() => Math.random() - 0.5));

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col gap-4 overflow-auto p-6" data-lenis-prevent>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={add}>+ Add</button>
        <button className="btn" onClick={shuffle}>Shuffle</button>
        <button className="btn" onClick={() => setItems((a) => [...a].sort((x, y) => x.text.localeCompare(y.text)))}>Sort A–Z</button>
      </div>
      <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((t, i) => (
            <Row key={t.id} t={t} i={i} n={items.length} move={move} remove={() => setItems((a) => a.filter((x) => x.id !== t.id))} />
          ))}
        </AnimatePresence>
      </Reorder.Group>
      {items.length === 0 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-dim">Empty. Add something.</motion.p>}
    </div>
  );
}
