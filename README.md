# MotionLab

A production-grade web animation lab: **51 demos across 7 sections**. It covers UI physics, scroll-driven timelines, WebGL rendered through a single shared canvas, Rive/Lottie state machines, GLSL shaders, simulations, audio, and native web motion.

Every demo comes with:

- **A live Playground.** Tune springs, beziers, scroll smoothing and shader uniforms at 60fps, then **export** the result as Motion, CSS `linear()`/`cubic-bezier()`, GSAP `CustomEase`, or GLSL.
- **A Perf HUD.** FPS, frame time against the 16.7ms budget, a frame sparkline, long tasks, and WebGL draw calls/triangles.
- **A Code tab** showing the demo's real source.
- **Notes** covering how it works, what it costs, and how it handles accessibility.
- **A reduced-motion path.** Toggle it in *Motion settings* to preview it at any time.

Stack: Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4 · Motion 13 · GSAP 3.15 (all plugins, now free) · Lenis · React Three Fiber 9 / drei 10 / three r186 · @react-three/postprocessing · @react-three/rapier · Rive · lottie-web · zustand.

All media (images, the 96-frame render sequence, videos, and Lottie files) is **generated procedurally** by scripts in `/scripts`. The repo contains no third-party media.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

Requires Node 20+. `predev`/`prebuild` copy each demo's source into `public/sources` for the Code tab.

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | The usual Next.js commands |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run smoke` | Visits all 60 routes in Chromium and fails on console errors or HTTP errors (needs a running server). `SMOKE_REDUCED=1` tests reduced-motion paths; `SMOKE_MOBILE=1` tests a 390px touch viewport. First run `npx playwright install chromium`, or point `CHROMIUM_PATH` at an existing Chrome. `scripts/serve-test.sh [filter]` starts a server, runs the smoke test, and stops the server |
| `npm run gen:media` | Re-renders images, the frame sequence and the MP4/WebM videos (Python 3 + numpy + Pillow + ffmpeg) |
| `npm run gen:lottie` | Re-generates the Lottie JSON files from code |

---

## Architecture

```
src/
├─ app/                          routes (server components)
│  ├─ layout.tsx                 <Providers> + header + Perf HUD
│  ├─ page.tsx                   hub (search, library filter, sections)
│  └─ lab/[category]/[slug]/     every demo is a static, shareable, indexable route
├─ demos/
│  ├─ registry.ts                ← single source of truth: metadata, playground controls, notes
│  ├─ loaders.ts                 slug → next/dynamic(ssr:false) (one chunk per demo)
│  ├─ types.ts
│  └─ <category>/<slug>.tsx      the demos (+ <slug>.*.ts helpers: workers, solvers, …)
├─ providers/
│  ├─ Providers.tsx              MotionConfig · Lenis · tier detection · the shared canvas
│  ├─ SmoothScroll.tsx           Lenis driven by gsap.ticker (ONE rAF loop)
│  ├─ CanvasRoot.tsx             the ONLY WebGL context: fixed <Canvas> + <View.Port>
│  ├─ RouteRefresh.tsx           scroll-to-top + ScrollTrigger.refresh() on navigation
│  └─ DeviceTier.tsx             detect-gpu (self-hosted benchmarks) + CPU/RAM/save-data
├─ components/
│  ├─ three/Scene.tsx            <View> wrapper: context bridge, loop registration, camera
│  ├─ three/GLStats.tsx          renderer.info → Perf HUD (no React state)
│  ├─ playground/                panel, spring graph, bezier editor, export menu
│  ├─ perf/PerfHUD.tsx
│  └─ shell/                     hub, demo shell, cards, code tab, scroll helpers
├─ store/
│  ├─ ui.ts                      reduced-motion override, quality tier, HUD (persisted)
│  └─ playground.tsx             per-demo store: useControl() vs useControlRef()
├─ hooks/                        useReducedMotion, useTier, useInView, useRafLoop, useCanvas2D, …
└─ lib/                          gsap.ts (plugin registration), spring.ts (physics + exports), perf.ts
```

### Patterns that keep it at 60fps

1. **One WebGL context for the whole site.** `CanvasRoot` is a fixed, pointer-transparent `<Canvas>`. 3D demos render `<Scene>` (drei `<View>`) inside normal DOM layout, and each view is a scissored viewport of that one context. This avoids the "too many WebGL contexts" error and the cost of creating a context per page. The loop runs only while at least one `<Scene>` is mounted (`frameloop="never"` otherwise), and switches to `demand` in reduced-motion mode.
   *Exceptions, by necessity:* the post-processing demo (full-screen composers can't render into a scissored view) and WebGPU (it needs its own renderer). Both pause when offscreen.
2. **One animation clock for scrolling.** Lenis runs with `autoRaf: false` and is ticked by `gsap.ticker`, with `lenis.on('scroll', ScrollTrigger.update)`. Two separate rAF loops are the classic cause of ScrollTrigger jitter.
3. **Playground values never trigger per-frame renders.** `useControl(key)` is reactive, for props React must see. `useControlRef(key)` is a ref kept in sync by a store subscription, for `useFrame`/rAF loops and `uniforms.x.value`. That split is why dragging a slider doesn't re-render the scene.
4. **Strict-Mode-safe GSAP.** Every timeline lives in `useGSAP({ scope, dependencies, revertOnUpdate })`, so tweens, ScrollTriggers, SplitText and Observers are reverted on unmount and on control changes. SplitText uses `autoSplit` with the tween returned from `onSplit`.
5. **Transforms and opacity only**, with `contain: layout paint` on demo stages. Pointer effects write to MotionValues or CSS custom properties, never to React state.
6. **Pause what you can't see.** Loops stop offscreen (IntersectionObserver) and in hidden tabs (`visibilitychange`). Sims use typed arrays and object pools, with no per-frame allocations.
7. **Work off the main thread.** The fluid solver runs in a Web Worker drawing to an `OffscreenCanvas`, with a main-thread fallback. The frame sequence is decoded with `createImageBitmap`.
8. **Quality tiers** (`high`/`mid`/`low`) set the DPR cap, particle counts, transmission samples, post-FX, and sim frame rate (30Hz on low). You can override the tier in *Motion settings* to compare costs in the HUD.

### Reduced motion, per library

| Layer | How |
|---|---|
| Global state | `useReducedMotion()` = OS preference **or** in-app override (System / On / Off) |
| Motion | `<MotionConfig reducedMotion>`: transforms become instant, opacity fades remain |
| GSAP | The effective flag is a `useGSAP` dependency; reduced branches replace scrub/pin with a fade or a static end state |
| Lenis | `smoothWheel: false`, so native scrolling |
| R3F | Canvas switches to `frameloop="demand"`; scenes render one static, fully lit frame |
| Rive / Lottie | Static pose / `goToAndStop(lastFrame)` |
| Canvas sims, audio | A single still frame; audio never autoplays |
| CSS | `html[data-reduced]` plus `@media (prefers-reduced-motion)` collapse CSS animations and transitions |

---

## Adding a demo

1. Add an entry to `src/demos/registry.ts` (slug, category, libs, depth, layout, playground controls, notes).
2. Create `src/demos/<category>/<slug>.tsx` with a default-exported client component.
3. Add one line to `src/demos/loaders.ts`.
4. Read controls with `useControl` / `useControlRef` / `useSpringControls` / `useTweenControls`. For 3D, wrap in `<Scene>`. For scroll demos, use `useScrollSettings()` + `useGSAP(..., { dependencies: deps, revertOnUpdate: true })`.
5. Give it a reduced-motion branch. Then run `npm run build && npm start` and `npm run smoke`.

The hub, category page, static route, SEO metadata, Playground, export menu and Code tab all come from the registry automatically.

---

## Assets & optional files

- `public/images`, `public/sequence`, `public/video` are generated by `scripts/gen_assets.py`. Videos ship as **WebM (VP9) + MP4 (H.264)**. The scrub videos are encoded all-intra (`-g 1`) so every seek lands instantly.
- `public/lottie/*.json` are generated by `scripts/gen-lottie.mjs`.
- `public/rive/rive.wasm` is the self-hosted Rive runtime, so there are no CDN calls. **Optional:** drop a community "login character" file at `public/rive/login.riv` (see `public/rive/README.md`) and the Rive demo switches from its code fallback to the real Rive state machine automatically.
- `public/benchmarks` holds detect-gpu's benchmark data, self-hosted.
- `public/fonts/Poppins-Bold.ttf` is used for in-scene 3D text (SIL Open Font License). UI fonts come from `@fontsource-variable/*`, so there are no Google Fonts requests.

Nothing loads from a third-party CDN at runtime.

## Browser notes

- View Transitions, `@starting-style`, and CSS scroll-driven animations degrade gracefully: the demos detect support and show a static or instant fallback.
- WebGPU falls back to WebGL2 automatically, and the badge shows which backend ran.
- The microphone input needs HTTPS (or localhost) and permission. The built-in synth needs neither.

---

## Demo index

**01 Physics Lab**

| Demo | Route | Tech |
|---|---|---|
| ★ Drag & Throw | `/lab/physics/drag-throw` | Motion |
| ★ Card → Fullscreen | `/lab/physics/shared-layout` | Motion |
| Layout Shift Smoothing | `/lab/physics/reorder-list` | Motion |
| Magnetic Buttons | `/lab/physics/magnetic-button` | Motion |
| ★ Stateful Button Morph | `/lab/physics/stateful-button` | Motion, SVG |
| Ripple Effects | `/lab/physics/ripple` | Motion, CSS |
| 3D Tilt & Glare | `/lab/physics/tilt-card` | Motion, CSS |
| ★ Staggered Menu | `/lab/physics/staggered-menu` | Motion, CSS |
| Modal & Drawer | `/lab/physics/modal-drawer` | Motion |
| ★ Morphing Command Palette | `/lab/physics/command-palette` | Motion |
| ★ Fluid Cursor & Hover Traps | `/lab/physics/cursor-follower` | Motion |
| Particle Trail | `/lab/physics/particle-trail` | Canvas 2D |

**02 Scroll Hub**

| Demo | Route | Tech |
|---|---|---|
| ★ Pinned Horizontal Panels | `/lab/scroll/horizontal-pin` | GSAP, ScrollTrigger, Lenis |
| ★ SplitText Reveals | `/lab/scroll/split-text` | GSAP, SplitText, ScrollTrigger |
| Depth Parallax | `/lab/scroll/parallax-layers` | GSAP, ScrollTrigger |
| Zoom-on-Scroll Reveal | `/lab/scroll/zoom-reveal` | GSAP, ScrollTrigger |
| Highlight Fill | `/lab/scroll/highlight-fill` | GSAP, SplitText, ScrollTrigger |
| Kinetic Marquee | `/lab/scroll/velocity-marquee` | GSAP, ScrollTrigger |
| ★ SVG Path Drawing | `/lab/scroll/svg-draw` | GSAP, DrawSVG, ScrollTrigger |
| SVG Shape Morphing | `/lab/scroll/svg-morph` | GSAP, MorphSVG, ScrollTrigger |
| ★ Flip Layout Grid | `/lab/scroll/flip-grid` | GSAP, Flip |
| Stacking Cards | `/lab/scroll/stacking-cards` | GSAP, ScrollTrigger, CSS |
| Observer Fullscreen Slides | `/lab/scroll/observer-slides` | GSAP, Observer, SplitText |
| Text Scramble / Decode | `/lab/scroll/text-scramble` | GSAP, ScrambleText |
| ★ Apple-Style Frame Scrub | `/lab/scroll/image-sequence` | GSAP, ScrollTrigger, Canvas 2D |

**03 3D Canvas**

| Demo | Route | Tech |
|---|---|---|
| ★ Glass Hero | `/lab/webgl/glass-hero` | R3F, drei, Three.js |
| ★ Scroll-Driven Disassembly | `/lab/webgl/scroll-disassembly` | R3F, drei, GSAP, ScrollTrigger |
| ★ Particle Swirl | `/lab/webgl/particle-swirl` | R3F, GLSL |
| Cursor-Reactive Shader Blob | `/lab/webgl/cursor-blob` | R3F, GLSL |
| Scroll Camera Flythrough | `/lab/webgl/camera-orbit` | R3F, GSAP, ScrollTrigger |
| ★ Bloom, DoF & Shadows | `/lab/webgl/postfx-pipeline` | R3F, Postprocessing, drei |
| Rigid-Body Physics | `/lab/webgl/rapier-drop` | R3F, Rapier |
| Instanced Wave Field | `/lab/webgl/instanced-wave` | R3F, GLSL |
| WebGPU + TSL (Stretch) | `/lab/webgl/webgpu-tsl` | Three.js, TSL |

**04 Vector Machines**

| Demo | Route | Tech |
|---|---|---|
| ★ Rive State-Machine Character | `/lab/vector/rive-login` | Rive, Motion, SVG |
| ★ Scroll-Scrubbed Lottie | `/lab/vector/lottie-scroll` | Lottie, GSAP, ScrollTrigger |
| Lottie State Toggles | `/lab/vector/lottie-toggles` | Lottie |

**05 Shaders & Media**

| Demo | Route | Tech |
|---|---|---|
| ★ Image Hover Distortion | `/lab/media/hover-distortion` | R3F, GLSL, drei |
| ★ Liquid Image Transition | `/lab/media/liquid-transition` | R3F, GLSL, GSAP |
| SVG Mask over Live Video | `/lab/media/video-mask` | SVG, Video, Motion, CSS |
| Animated clip-path | `/lab/media/clip-path` | Motion, CSS |
| Video Scroll Scrub | `/lab/media/video-scrub` | Video, GSAP, ScrollTrigger |
| Generative Noise Gradient | `/lab/media/noise-gradient` | R3F, GLSL |

**06 Simulations & Audio**

| Demo | Route | Tech |
|---|---|---|
| ★ Fluid Simulation (Worker) | `/lab/sims/fluid-sim` | Web Worker, Canvas 2D |
| Verlet Cloth | `/lab/sims/cloth-sim` | Canvas 2D |
| Flow Field | `/lab/sims/flow-field` | Canvas 2D |
| ★ Audio Visualizer | `/lab/sims/audio-visualizer` | Web Audio, Canvas 2D, R3F |

**07 Native Web**

| Demo | Route | Tech |
|---|---|---|
| ★ View Transitions API | `/lab/native/view-transitions` | View Transitions, CSS |
| ★ CSS Scroll-Driven Animations | `/lab/native/css-scroll-timeline` | CSS |
| ★ Same Effect, 4 Engines | `/lab/native/four-engines` | CSS, WAAPI, Motion, GSAP |
| @starting-style Entry/Exit | `/lab/native/starting-style` | CSS |
