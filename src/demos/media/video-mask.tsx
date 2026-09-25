'use client';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useControl } from '@/store/playground';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// knockout text as an SVG data-URI mask (white = visible)
const TEXT_MASK = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 400' preserveAspectRatio='xMidYMid meet'><text x='500' y='285' text-anchor='middle' font-family='Arial Black, Arial, sans-serif' font-weight='900' font-size='260' letter-spacing='-10' fill='white'>ORBIT</text></svg>`,
)}")`;

// two blob outlines with IDENTICAL command structure → clip-path: path() can interpolate
const BLOB_A = "path('M240,40 C340,40 440,120 440,220 C440,330 350,420 240,420 C120,420 40,330 40,220 C40,110 140,40 240,40 Z')";
const BLOB_B = "path('M260,20 C380,60 460,140 420,250 C390,360 300,440 200,400 C90,360 20,290 60,190 C90,90 150,-10 260,20 Z')";

export default function VideoMask() {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const mode = useControl<string>('mask', 'text');
  const radius = useControl('radius', 160);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(!reduced);

  useEffect(() => {
    const v = video.current!;
    if (playing && !reduced) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [playing, reduced, mode]); // mode swaps the <video> element → re-apply play state

  // pointer → CSS custom properties only (no React renders)
  const onMove = (e: React.PointerEvent) => {
    const b = wrap.current!.getBoundingClientRect();
    wrap.current!.style.setProperty('--x', `${e.clientX - b.left}px`);
    wrap.current!.style.setProperty('--y', `${e.clientY - b.top}px`);
  };

  const common = 'absolute inset-0 h-full w-full object-cover';
  const masked: React.CSSProperties =
    mode === 'text'
      ? { maskImage: TEXT_MASK, WebkitMaskImage: TEXT_MASK, maskSize: '90% auto', WebkitMaskSize: '90% auto', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }
      : mode === 'spotlight'
        ? { maskImage: `radial-gradient(circle ${radius}px at var(--x, 50%) var(--y, 50%), #000 55%, transparent 100%)`, WebkitMaskImage: `radial-gradient(circle ${radius}px at var(--x, 50%) var(--y, 50%), #000 55%, transparent 100%)` }
        : {};

  return (
    <div ref={wrap} onPointerMove={onMove} className="relative h-full overflow-hidden bg-ink">
      {/* dim base layer so the spotlight has something to reveal from */}
      {mode === 'spotlight' && (
        <video muted loop playsInline autoPlay={!reduced} className={`${common} opacity-15 grayscale`} aria-hidden>
          <source src="/video/orbit-loop.webm" type="video/webm" />
          <source src="/video/orbit-loop.mp4" type="video/mp4" />
        </video>
      )}
      {mode === 'blob' ? (
        <div className="absolute inset-0 grid place-items-center">
          <motion.div className="relative h-[460px] w-[480px] max-w-full" animate={reduced ? undefined : { clipPath: [BLOB_A, BLOB_B, BLOB_A] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} style={{ clipPath: BLOB_A }}>
            <video ref={video} muted loop playsInline className={common}>
              <source src="/video/orbit-loop.webm" type="video/webm" />
              <source src="/video/orbit-loop.mp4" type="video/mp4" />
            </video>
          </motion.div>
        </div>
      ) : (
        <video ref={video} muted loop playsInline className={common} style={masked}>
          <source src="/video/orbit-loop.webm" type="video/webm" />
          <source src="/video/orbit-loop.mp4" type="video/mp4" />
        </video>
      )}
      <div className="absolute bottom-5 left-5 z-10 flex items-center gap-3">
        <button className="btn" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>{playing ? '❚❚ Pause' : '▶ Play'} video</button>
        <span className="eyebrow">mask: {mode}{mode === 'spotlight' ? ' — move the pointer' : ''}</span>
      </div>
    </div>
  );
}
