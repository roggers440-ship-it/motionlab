'use client';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Scene } from '@/components/three/Scene';
import { useCanvas2D } from '@/hooks/useCanvas2D';
import { useRafLoop } from '@/hooks/useRafLoop';
import { useInView, usePageVisible } from '@/hooks/useInView';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useControl, useControlRef } from '@/store/playground';

// ------------------------------------------------------------------ audio engine
type Engine = {
  ctx: AudioContext;
  analyser: AnalyserNode;
  out: GainNode;
  freq: Uint8Array<ArrayBuffer>;
  wave: Uint8Array<ArrayBuffer>;
  stop: () => void;
};

function createEngine(): Engine {
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  const out = ctx.createGain();
  out.gain.value = 0.6;
  analyser.connect(out).connect(ctx.destination);
  return {
    ctx, analyser, out,
    freq: new Uint8Array(analyser.frequencyBinCount), // reused every frame: zero allocations
    wave: new Uint8Array(analyser.fftSize),
    stop: () => {},
  };
}

/** A tiny step sequencer (kick, hat, bass, arp) scheduled with a look-ahead clock. */
function startSynth(e: Engine) {
  const { ctx, analyser } = e;
  const bus = ctx.createGain();
  bus.gain.value = 0.8;
  bus.connect(analyser);
  const noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  noise.getChannelData(0).forEach((_, i, a) => (a[i] = Math.random() * 2 - 1));
  const bpm = 118, step = 60 / bpm / 4;
  const bass = [36, 36, 48, 36, 39, 39, 51, 39, 34, 34, 46, 34, 41, 41, 53, 43];
  const arp = [60, 63, 67, 70, 72, 70, 67, 63];
  const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);
  let n = 0;
  let next = ctx.currentTime + 0.05;

  const kick = (t: number) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g).connect(bus);
    o.start(t); o.stop(t + 0.3);
  };
  const hat = (t: number, open: boolean) => {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.15 : 0.04));
    s.connect(f).connect(g).connect(bus);
    s.start(t); s.stop(t + 0.2);
  };
  const tone = (t: number, midi: number, type: OscillatorType, dur: number, vol: number, cutoff: number) => {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = type; o.frequency.value = mtof(midi);
    f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff, t); f.frequency.exponentialRampToValueAtTime(cutoff * 0.3, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f).connect(g).connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  };

  // "A tale of two clocks": a coarse JS timer schedules notes precisely on the audio clock
  const id = setInterval(() => {
    while (next < ctx.currentTime + 0.12) {
      const s = n % 16;
      if (s % 4 === 0) kick(next);
      hat(next, s % 4 === 2);
      if (s % 2 === 0) tone(next, bass[(n / 2) % 16 | 0], 'sawtooth', step * 1.8, 0.35, 900);
      tone(next, arp[n % 8] + (Math.floor(n / 32) % 2 ? 5 : 0), 'square', step * 0.9, 0.08, 3000);
      next += step;
      n++;
    }
  }, 25);
  return () => {
    clearInterval(id);
    bus.disconnect();
  };
}

// ------------------------------------------------------------------ 3D mode
const vertex = /* glsl */ `
  uniform sampler2D uFFT; uniform float uGain; uniform float uTime;
  varying float vAmp;
  void main() {
    vec3 n = normalize(position);
    // map each vertex to a frequency bin by its angle around Y (low → high)
    float u = fract(atan(n.z, n.x) / 6.2831853 + 0.5) * 0.45 + abs(n.y) * 0.05;
    float amp = texture2D(uFFT, vec2(u, 0.5)).r;
    vAmp = amp;
    vec3 p = position + normal * amp * uGain * 0.9;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const fragment = /* glsl */ `
  varying float vAmp;
  void main() { gl_FragColor = vec4(mix(vec3(0.2, 0.25, 0.9), vec3(1.0, 0.4, 0.8), vAmp) + vAmp * 0.3, 1.0); }`;

function FFTSphere({ engine }: { engine: React.RefObject<Engine | null> }) {
  const gain = useControlRef('gain', 1.2);
  const mesh = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const t = new THREE.DataTexture(new Uint8Array(1024), 1024, 1, THREE.RedFormat, THREE.UnsignedByteType);
    t.magFilter = t.minFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  }, []);
  const uniforms = useMemo(() => ({ uFFT: { value: tex }, uGain: { value: 1 }, uTime: { value: 0 } }), [tex]);
  useEffect(() => () => tex.dispose(), [tex]);
  useFrame((_, dt) => {
    const e = engine.current;
    uniforms.uGain.value = gain.current;
    if (e) {
      e.analyser.getByteFrequencyData(e.freq);
      (tex.image.data as Uint8Array).set(e.freq.subarray(0, 1024));
      tex.needsUpdate = true;
    }
    if (mesh.current) mesh.current.rotation.y += dt * 0.2;
  });
  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.3, 64]} />
      <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} wireframe />
    </mesh>
  );
}

// ------------------------------------------------------------------ component
export default function AudioVisualizer() {
  const engine = useRef<Engine | null>(null);
  const [source, setSource] = useState<'off' | 'synth' | 'mic' | 'file'>('off');
  const [volume, setVolume] = useState(0.6);
  const [error, setError] = useState('');
  const mode = useControl<string>('mode', 'bars');
  const smoothing = useControl('smoothing', 0.8);
  const gain = useControlRef('gain', 1.2);
  const reduced = useReducedMotion();
  const { ref, w, h, dpr } = useCanvas2D();
  const inView = useInView(ref);
  const visible = usePageVisible();

  const stop = () => {
    engine.current?.stop();
    engine.current?.ctx.close();
    engine.current = null;
    setSource('off');
  };
  useEffect(() => stop, []);
  useEffect(() => {
    if (engine.current) engine.current.analyser.smoothingTimeConstant = smoothing;
  }, [smoothing, source]);
  useEffect(() => {
    if (engine.current) engine.current.out.gain.value = volume;
  }, [volume, source]);

  // every start happens inside a click handler → satisfies autoplay policy
  const start = async (kind: 'synth' | 'mic' | 'file', file?: File) => {
    stop();
    setError('');
    const e = createEngine();
    try {
      if (kind === 'synth') e.stop = startSynth(e);
      if (kind === 'mic') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const src = e.ctx.createMediaStreamSource(stream);
        src.connect(e.analyser);
        e.analyser.disconnect(); // never route the mic to the speakers (feedback)
        e.stop = () => stream.getTracks().forEach((t) => t.stop());
      }
      if (kind === 'file' && file) {
        const buf = await e.ctx.decodeAudioData(await file.arrayBuffer());
        const src = e.ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.connect(e.analyser);
        src.start();
        e.stop = () => src.stop();
      }
      engine.current = e;
      setSource(kind);
    } catch (err) {
      e.ctx.close();
      setError(kind === 'mic' ? 'Microphone permission denied or unavailable.' : String(err));
    }
  };

  useRafLoop(
    () => {
      const ctx = ref.current?.getContext('2d');
      const e = engine.current;
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!e || mode === '3d') return;
      const G = gain.current;
      if (mode === 'wave') {
        e.analyser.getByteTimeDomainData(e.wave);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#38e1c6';
        ctx.beginPath();
        for (let i = 0; i < e.wave.length; i += 2) {
          const x = (i / e.wave.length) * w;
          const y = h / 2 + ((e.wave[i] - 128) / 128) * (h / 2.4) * G;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
        return;
      }
      e.analyser.getByteFrequencyData(e.freq);
      const N = 72;
      // log-spaced bins: equal visual weight per octave
      const bin = (k: number) => e.freq[Math.min(e.freq.length - 1, Math.floor(2 * Math.pow(e.freq.length / 4, k / N)))] / 255;
      if (mode === 'bars') {
        const bw = w / N;
        for (let k = 0; k < N; k++) {
          const v = Math.min(1, bin(k) * G);
          const bh = v * h * 0.85;
          ctx.fillStyle = `hsl(${280 + k * 1.4}, 90%, ${45 + v * 25}%)`;
          ctx.fillRect(k * bw + 1, h - bh, bw - 2, bh);
        }
      } else {
        const cx = w / 2, cy = h / 2, r0 = Math.min(w, h) * 0.18;
        ctx.lineWidth = Math.max(2, (Math.PI * 2 * r0) / N - 2);
        ctx.lineCap = 'round';
        for (let k = 0; k < N; k++) {
          const v = Math.min(1, bin(k) * G);
          const a = (k / N) * Math.PI * 2 - Math.PI / 2;
          const r1 = r0 + v * Math.min(w, h) * 0.28;
          ctx.strokeStyle = `hsl(${300 + k * 1.2}, 90%, ${50 + v * 20}%)`;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
          ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
          ctx.stroke();
        }
      }
    },
    { active: inView && visible && !reduced },
  );

  return (
    <div className="relative flex h-full flex-col">
      <div className="relative z-30 flex flex-wrap items-center gap-2 border-b border-line p-4">
        <button className="btn btn-primary" onClick={() => start('synth')}>▶ Built-in synth</button>
        <button className="btn" onClick={() => start('mic')}>🎙 Microphone</button>
        <label className="btn cursor-pointer">
          ♫ Your file
          <input type="file" accept="audio/*" className="sr-only" onChange={(e) => e.target.files?.[0] && start('file', e.target.files[0])} />
        </label>
        <button className="btn" onClick={stop} disabled={source === 'off'}>■ Stop</button>
        <label className="ml-auto flex items-center gap-2 text-xs text-dim">
          Volume
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(+e.target.value)} className="w-28" style={{ '--fill': `${volume * 100}%` } as React.CSSProperties} />
        </label>
      </div>
      <div className="relative flex-1">
        <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden style={{ visibility: mode === '3d' ? 'hidden' : 'visible' }} />
        {mode === '3d' && (
          <Scene className="absolute inset-0" camera={{ position: [0, 0, 5] }}>
            <FFTSphere engine={engine} />
          </Scene>
        )}
        {source === 'off' && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
            <p className="max-w-sm text-dim">Audio never autoplays. Pick a source above — the built-in synth needs no permissions.</p>
          </div>
        )}
        {error && <p role="alert" className="absolute bottom-4 left-4 text-sm text-[#ff5a6a]">{error}</p>}
        <p className="eyebrow pointer-events-none absolute right-4 top-4 z-30">source: {source} · mode: {mode}</p>
      </div>
    </div>
  );
}
