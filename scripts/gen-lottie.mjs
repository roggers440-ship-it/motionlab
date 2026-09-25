// Generates the Lottie JSON files in /public/lottie from code.
// Real projects export these from After Effects (Bodymovin) or LottieFiles —
// hand-authoring them here keeps the repo free of third-party assets and shows
// exactly what the format is: layers → shape groups → keyframed properties.
//
//   node scripts/gen-lottie.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'lottie');
mkdirSync(out, { recursive: true });

// ---------- tiny Lottie DSL ----------
const EASE = { i: { x: [0.25], y: [1] }, o: { x: [0.6], y: [0] } };
const st = (k) => ({ a: 0, k });
/** keyframes: [[frame, value], ...] */
const kf = (frames) => ({
  a: 1,
  k: frames.map(([t, s], idx) =>
    idx === frames.length - 1 ? { t, s: [].concat(s) } : { t, s: [].concat(s), ...EASE }),
});
const rgba = (hex, a = 1) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a];
};
const tr = ({ p = [0, 0], a = [0, 0], s = [100, 100], r = 0, o = 100 } = {}) => ({
  ty: 'tr',
  p: Array.isArray(p) && Array.isArray(p[0]) ? kf(p) : p.a !== undefined ? p : st(p),
  a: st(a),
  s: s.a !== undefined ? s : st(s),
  r: r.a !== undefined ? r : st(r),
  o: o.a !== undefined ? o : st(o),
  sk: st(0),
  sa: st(0),
});
const group = (nm, items, transform = {}) => ({ ty: 'gr', nm, it: [...items, tr(transform)] });
const ellipse = (size, p = [0, 0]) => ({ ty: 'el', p: st(p), s: size.a !== undefined ? size : st(size), d: 1 });
const rect = (size, r = 0, p = [0, 0]) => ({ ty: 'rc', p: st(p), s: st(size), r: st(r), d: 1 });
const star = (outer, inner, points = 5) => ({
  ty: 'sr', sy: 1, d: 1, p: st([0, 0]), r: st(0), pt: st(points),
  ir: st(inner), is: st(0), or: st(outer), os: st(0),
});
const path = (v, closed = false, i, o) => ({
  ty: 'sh',
  ks: st({ c: closed, v, i: i ?? v.map(() => [0, 0]), o: o ?? v.map(() => [0, 0]) }),
});
const fill = (hex, o = 100) => ({ ty: 'fl', c: st(rgba(hex)), o: typeof o === 'number' ? st(o) : o, r: 1 });
const stroke = (hex, w, o = 100) => ({
  ty: 'st', c: st(rgba(hex)), o: typeof o === 'number' ? st(o) : o, w: typeof w === 'number' ? st(w) : w, lc: 2, lj: 2, ml: 4,
});
const trim = (end, start = st(0)) => ({ ty: 'tm', s: start, e: end, o: st(0), m: 1 });

let ind = 0;
const layer = (nm, shapes, { op, p, s = [100, 100, 100], r = 0, o = 100 }) => ({
  ddd: 0, ind: ++ind, ty: 4, nm, sr: 1, ao: 0, ip: 0, op, st: 0, bm: 0,
  ks: {
    o: o.a !== undefined ? o : st(o),
    r: r.a !== undefined ? r : st(r),
    p: st([...p, 0]),
    a: st([0, 0, 0]),
    s: s.a !== undefined ? s : st(s),
  },
  shapes,
});
const comp = (nm, w, h, op, layers) => {
  ind = 0;
  return { v: '5.7.4', fr: 60, ip: 0, op, w, h, nm, ddd: 0, assets: [], layers: layers() };
};
const save = (name, data) => {
  writeFileSync(join(out, name), JSON.stringify(data));
  console.log('lottie →', name);
};

// ---------- 1. orbit.json — long timeline made for scroll scrubbing ----------
save('orbit.json', comp('orbit', 600, 600, 180, () => {
  const L = [];
  const C = [300, 300];
  // three orbiting dots (position keyframes around a circle)
  ['#ff6ec7', '#7c5cff', '#38e1c6'].forEach((col, n) => {
    const frames = Array.from({ length: 13 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2 + (n * Math.PI * 2) / 3;
      return [i * 15, [Math.cos(a) * 190, Math.sin(a) * 190]];
    });
    L.push(layer(`dot-${n}`, [group('dot', [ellipse([34, 34]), fill(col)], { p: frames })], { op: 180, p: C }));
  });
  // star: grows, spins, morphs its inner radius
  L.push(layer('star', [
    group('star', [
      { ...star(120, 50, 6), ir: kf([[0, 50], [90, 110], [180, 50]]), pt: kf([[0, 3], [90, 8], [180, 3]]) },
      fill('#ffd479'),
    ]),
  ], { op: 180, p: C, r: kf([[0, 0], [180, 360]]), s: kf([[0, [20, 20, 100]], [60, [100, 100, 100]], [180, [70, 70, 100]]]) }));
  // ring: stroke drawn with a trim path
  L.push(layer('ring', [
    group('ring', [ellipse([470, 470]), trim(kf([[0, 0], [150, 100]])), stroke('#ffffff', 6, 70)]),
  ], { op: 180, p: C, r: -90 }));
  return L;
}));

// ---------- 2. menu.json — hamburger ↔ close (0 → 30) ----------
save('menu.json', comp('menu', 120, 120, 31, () => {
  const bar = (nm, y, rot, dy, fade) => layer(nm, [group(nm, [rect([64, 8], 4), fill('#ffffff')])], {
    op: 31,
    p: [60, 60 + y],
    r: rot ? kf([[0, 0], [30, rot]]) : 0,
    s: fade ? kf([[0, [100, 100, 100]], [18, [0, 100, 100]]]) : [100, 100, 100],
    o: fade ? kf([[0, 100], [18, 0]]) : 100,
  });
  const L = [bar('top', -20, 45, 20), bar('mid', 0, 0, 0, true), bar('bottom', 20, -45, -20)];
  // move top & bottom to the centre while rotating
  L[0].ks.p = kf([[0, [60, 40, 0]], [30, [60, 60, 0]]]);
  L[2].ks.p = kf([[0, [60, 80, 0]], [30, [60, 60, 0]]]);
  return L;
}));

// ---------- 3. heart.json — like button with burst (0 → 45) ----------
// closed heart path: vertices + in/out bezier tangents (relative to each vertex)
const hv = [[0, 30], [-36, -4], [-20, -32], [0, -18], [20, -32], [36, -4]];
const hi = [[14, 12], [0, 12], [-12, 0], [-4, -10], [-10, 0], [0, -14]];
const ho = [[-14, 12], [0, -14], [10, 0], [4, -10], [12, 0], [0, 12]];
save('heart.json', comp('heart', 160, 160, 46, () => {
  const L = [];
  // burst particles
  Array.from({ length: 8 }).forEach((_, n) => {
    const a = (n / 8) * Math.PI * 2;
    L.push(layer(`p${n}`, [group('p', [ellipse([10, 10]), fill(n % 2 ? '#ff6ec7' : '#ffd479')], {
      p: [[8, [Math.cos(a) * 20, Math.sin(a) * 20]], [34, [Math.cos(a) * 62, Math.sin(a) * 62]]],
    })], { op: 46, p: [80, 80], o: kf([[0, 0], [8, 100], [30, 100], [40, 0]]) }));
  });
  // ring pulse
  L.push(layer('ring', [group('ring', [ellipse(kf([[0, [10, 10]], [22, [120, 120]]])), stroke('#ff6ec7', kf([[0, 18], [22, 0]]))])],
    { op: 46, p: [80, 80] }));
  // heart: pop + color
  L.push(layer('heart', [group('heart', [path(hv, true, hi, ho), { ...fill('#ff3d7f'), c: kf([[0, rgba('#8a8aa3')], [10, rgba('#ff3d7f')]]) }])],
    { op: 46, p: [80, 84], s: kf([[0, [100, 100, 100]], [8, [60, 60, 100]], [22, [125, 125, 100]], [34, [100, 100, 100]]]) }));
  return L;
}));

// ---------- 4. check.json — checkbox draw (0 → 36) ----------
save('check.json', comp('check', 120, 120, 37, () => [
  layer('check', [group('check', [path([[-22, 2], [-6, 18], [24, -16]]), trim(kf([[12, 0], [34, 100]])), stroke('#0b0b12', 10)])],
    { op: 37, p: [60, 60] }),
  layer('box', [group('box', [rect([84, 84], 22), fill('#38e1c6', kf([[0, 0], [14, 100]])), stroke('#38e1c6', 6)])],
    { op: 37, p: [60, 60], s: kf([[0, [100, 100, 100]], [8, [86, 86, 100]], [20, [100, 100, 100]]]) }),
]));
