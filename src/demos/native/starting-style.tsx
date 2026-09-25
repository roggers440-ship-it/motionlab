'use client';
import { useRef, useState } from 'react';
import { useTweenControls } from '@/store/playground';

export default function StartingStyle() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [toasts, setToasts] = useState<number[]>([]);
  const { duration, css } = useTweenControls({ duration: 0.35 });

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-6" style={{ '--d': `${duration}s`, '--e': css } as React.CSSProperties}>
      <style>{`
        /* entry + exit with no JavaScript animation code */
        .ss-pop, .ss-dialog {
          opacity: 0; transform: translateY(10px) scale(.96);
          transition: opacity var(--d) var(--e), transform var(--d) var(--e), overlay var(--d) allow-discrete, display var(--d) allow-discrete;
        }
        .ss-pop:popover-open, .ss-dialog[open] { opacity: 1; transform: none; }
        @starting-style {
          .ss-pop:popover-open, .ss-dialog[open] { opacity: 0; transform: translateY(10px) scale(.96); }
        }
        .ss-dialog::backdrop { background: rgb(0 0 0 / 0); backdrop-filter: blur(0); transition: all var(--d) allow-discrete; }
        .ss-dialog[open]::backdrop { background: rgb(0 0 0 / .55); backdrop-filter: blur(3px); }
        @starting-style { .ss-dialog[open]::backdrop { background: rgb(0 0 0 / 0); backdrop-filter: blur(0); } }
        .ss-toast { transition: opacity var(--d) var(--e), translate var(--d) var(--e); }
        @starting-style { .ss-toast { opacity: 0; translate: 0 20px; } }
      `}</style>

      <div className="flex flex-wrap justify-center gap-3">
        <button className="btn btn-primary" popoverTarget="ss-popover">Toggle popover</button>
        <button className="btn" onClick={() => dialog.current?.showModal()}>Open &lt;dialog&gt;</button>
        <button className="btn" onClick={() => setToasts((t) => [...t.slice(-3), Date.now()])}>Add toast</button>
      </div>

      <div id="ss-popover" popover="auto" className="ss-pop m-auto w-72 rounded-2xl border border-line-2 bg-ink-3 p-5 text-fg shadow-2xl">
        <p className="font-display text-lg font-semibold">Native popover</p>
        <p className="mt-1 text-sm text-dim">Top layer, light-dismiss and Esc for free. Entry via @starting-style, exit via allow-discrete.</p>
      </div>

      <dialog ref={dialog} className="ss-dialog m-auto w-[min(90vw,420px)] rounded-3xl border border-line-2 bg-ink-3 p-6 text-fg">
        <p className="font-display text-2xl font-semibold">Native &lt;dialog&gt;</p>
        <p className="mt-2 text-dim">Focus is managed by the browser. The backdrop animates too.</p>
        <form method="dialog" className="mt-4 text-right">
          <button className="btn">Close</button>
        </form>
      </dialog>

      <ul className="flex w-72 flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <li key={t} className="ss-toast rounded-xl border border-line bg-ink-3 px-4 py-3 text-sm">
            Toast {new Date(t).toLocaleTimeString()} — entered with @starting-style
          </li>
        ))}
      </ul>
    </div>
  );
}
