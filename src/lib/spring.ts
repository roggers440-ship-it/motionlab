// Spring & easing math used by the Playground graph and the export menu.
// Physics: m·x'' = -k·(x − 1) − c·x'   (same model Motion uses)

export type SpringParams = { stiffness: number; damping: number; mass: number; velocity?: number };
export type Bezier = [number, number, number, number];

export function simulateSpring({ stiffness, damping, mass, velocity = 0 }: SpringParams, maxSeconds = 6) {
  const dt = 1 / 240;
  let x = 0;
  let v = velocity;
  const samples: number[] = [];
  let settledFor = 0;
  let t = 0;
  for (; t < maxSeconds; t += dt) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt;
    x += v * dt;
    samples.push(x);
    if (Math.abs(x - 1) < 0.0015 && Math.abs(v) < 0.01) settledFor += dt;
    else settledFor = 0;
    if (settledFor > 0.05) break;
  }
  return { samples, duration: Math.max(t, dt), dt };
}

/** Downsample a curve to N evenly spaced points in time (0..1). */
export function resample(samples: number[], n: number) {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.min(samples.length - 1, Math.round((i / (n - 1)) * (samples.length - 1)));
    out.push(samples[idx]);
  }
  return out;
}

const r = (n: number, p = 4) => Number(n.toFixed(p));

export function springExports(p: SpringParams) {
  const { samples, duration } = simulateSpring(p);
  const pts = resample(samples, 40);
  const css = `linear(${pts.map((v) => r(v, 3)).join(', ')})`;
  const path = 'M0,0 ' + pts.map((v, i) => `L${r(i / (pts.length - 1))},${r(v)}`).join(' ');
  return {
    duration: r(duration, 2),
    motion: `transition={{ type: 'spring', stiffness: ${p.stiffness}, damping: ${p.damping}, mass: ${p.mass}${p.velocity ? `, velocity: ${p.velocity}` : ''} }}`,
    css: `transition: transform ${r(duration, 2)}s ${css};`,
    gsap: `// gsap.registerPlugin(CustomEase)\nconst spring = CustomEase.create('spring', '${path}');\ngsap.to(el, { x: 200, duration: ${r(duration, 2)}, ease: spring });`,
  };
}

// ---------- cubic-bezier ----------
export function bezierAt([x1, y1, x2, y2]: Bezier, t: number) {
  // returns point on curve for parameter t (not time-solved) — fine for drawing
  const u = 1 - t;
  return {
    x: 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t,
    y: 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t,
  };
}

export function bezierExports(b: Bezier, duration: number) {
  const [x1, y1, x2, y2] = b.map((n) => r(n, 3));
  return {
    duration,
    motion: `transition={{ duration: ${duration}, ease: [${x1}, ${y1}, ${x2}, ${y2}] }}`,
    css: `transition: transform ${duration}s cubic-bezier(${x1}, ${y1}, ${x2}, ${y2});`,
    gsap: `const ease = CustomEase.create('custom', 'M0,0 C${x1},${y1} ${x2},${y2} 1,1');\ngsap.to(el, { x: 200, duration: ${duration}, ease });`,
  };
}

export function uniformExports(values: Record<string, unknown>) {
  const lines = Object.entries(values).map(([k, v]) => {
    const name = 'u' + k[0].toUpperCase() + k.slice(1);
    if (typeof v === 'number') return `uniform float ${name}; // ${r(v, 4)}`;
    if (typeof v === 'boolean') return `uniform bool ${name}; // ${v}`;
    if (typeof v === 'string' && v.startsWith('#')) return `uniform vec3 ${name}; // ${v}`;
    return `// ${name}: ${JSON.stringify(v)}`;
  });
  return { glsl: lines.join('\n'), json: JSON.stringify(values, null, 2) };
}
