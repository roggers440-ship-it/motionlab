// The single source of truth for every demo: metadata only, zero demo code.
// The hub, category pages, static params, SEO metadata and the Playground
// are all generated from this file. Demo components are lazy-loaded
// separately in `loaders.ts`, so importing the registry costs ~nothing.
import type { Category, CategoryId, Control, DemoMeta } from './types';

export const categories: Category[] = [
  { id: 'physics', index: '01', title: 'Physics Lab', tagline: 'Springs, drag, layout morphing, micro-interactions and cursor physics.', hue: 320 },
  { id: 'scroll', index: '02', title: 'Scroll Hub', tagline: 'Pinning, parallax, split text, SVG drawing and scroll-scrubbed timelines.', hue: 265 },
  { id: 'webgl', index: '03', title: '3D Canvas', tagline: 'One shared WebGL context, many scenes: glass, particles, physics, post FX.', hue: 200 },
  { id: 'vector', index: '04', title: 'Vector Machines', tagline: 'Rive state machines and Lottie playheads driven by input and scroll.', hue: 160 },
  { id: 'media', index: '05', title: 'Shaders & Media', tagline: 'GLSL image distortion, liquid transitions, video masking and scrubbing.', hue: 35 },
  { id: 'sims', index: '06', title: 'Simulations & Audio', tagline: 'Fluid, cloth and flow-field sims plus a real-time audio visualizer.', hue: 10 },
  { id: 'native', index: '07', title: 'Native Web', tagline: 'View Transitions, CSS scroll timelines, @starting-style — and when to skip JS.', hue: 95 },
];

// ---------- control presets ----------
const spring = (s = 300, d = 26, m = 1): Control[] => [
  { type: 'range', key: 'stiffness', label: 'Stiffness', min: 20, max: 1000, step: 1, default: s },
  { type: 'range', key: 'damping', label: 'Damping', min: 1, max: 100, step: 1, default: d },
  { type: 'range', key: 'mass', label: 'Mass', min: 0.1, max: 5, step: 0.1, default: m },
  { type: 'range', key: 'velocity', label: 'Initial velocity', min: -20, max: 20, step: 0.5, default: 0 },
];
const tween = (duration = 0.6, bezier: [number, number, number, number] = [0.22, 1, 0.36, 1]): Control[] => [
  { type: 'range', key: 'duration', label: 'Duration', min: 0.1, max: 3, step: 0.05, default: duration, unit: 's' },
  { type: 'range', key: 'x1', label: 'Bezier x1', min: 0, max: 1, step: 0.01, default: bezier[0] },
  { type: 'range', key: 'y1', label: 'Bezier y1', min: -1, max: 2, step: 0.01, default: bezier[1] },
  { type: 'range', key: 'x2', label: 'Bezier x2', min: 0, max: 1, step: 0.01, default: bezier[2] },
  { type: 'range', key: 'y2', label: 'Bezier y2', min: -1, max: 2, step: 0.01, default: bezier[3] },
];
const scroll = (scrub = 1): Control[] => [
  { type: 'range', key: 'lerp', label: 'Lenis lerp', min: 0.02, max: 1, step: 0.01, default: 0.1 },
  { type: 'range', key: 'scrub', label: 'Scrub smoothing', min: 0, max: 3, step: 0.1, default: scrub, unit: 's' },
  { type: 'toggle', key: 'markers', label: 'ScrollTrigger markers', default: false },
];
const range = (key: string, label: string, min: number, max: number, step: number, def: number, unit?: string): Control => ({
  type: 'range', key, label, min, max, step, default: def, unit,
});
const select = (key: string, label: string, options: string[], def = options[0]): Control => ({ type: 'select', key, label, options, default: def });
const toggle = (key: string, label: string, def = false): Control => ({ type: 'toggle', key, label, default: def });
const color = (key: string, label: string, def: string): Control => ({ type: 'color', key, label, default: def });

// Reusable note fragments
const TRANSFORM_ONLY = 'Only transform and opacity are animated, so every frame is composite-only: no layout, no paint.';
const MOTION_VALUES = 'Pointer/drag values live in MotionValues — they update the DOM directly and never trigger a React render.';
const RM_MOTION = 'Wrapped in <MotionConfig reducedMotion>, so transform animations collapse to instant while opacity fades remain.';
const RM_GSAP = 'Runs inside useGSAP with the effective reduced-motion flag as a dependency — reduced mode swaps scrubbed motion for simple fades.';
const SHARED_CANVAS = 'Renders through the single shared <Canvas> via drei <View> — no extra WebGL context, and the render loop only runs while a view is mounted.';
const RM_3D = 'In reduced mode the scene renders on demand only: a static, fully lit frame with no idle motion.';

export const demos: DemoMeta[] = [
  // ------------------------------------------------------------------ 01 PHYSICS
  {
    slug: 'drag-throw', category: 'physics', title: 'Drag & Throw', depth: 'showcase', layout: 'stage',
    blurb: 'Fling cards around a bounded table. Momentum, elastic edges and spring snap-back.',
    libs: ['Motion'],
    playground: { kind: 'spring', controls: [...spring(260, 20, 1), range('elastic', 'Edge elasticity', 0, 1, 0.05, 0.35), range('power', 'Throw power', 0, 1, 0.05, 0.4)] },
    notes: {
      how: 'drag + dragConstraints bound to the table ref; dragTransition converts release velocity into an inertia animation whose bounceStiffness/bounceDamping come from the Playground.',
      perf: `${MOTION_VALUES} ${TRANSFORM_ONLY}`,
      a11y: 'Cards are focusable buttons; arrow keys nudge them so the demo is usable without a pointer.',
    },
  },
  {
    slug: 'shared-layout', category: 'physics', title: 'Card → Fullscreen', depth: 'showcase', layout: 'stage',
    blurb: 'Shared-element transition with layoutId: a grid card morphs into a full-screen dialog and back.',
    libs: ['Motion'],
    playground: { kind: 'spring', controls: spring(320, 32, 1) },
    notes: {
      how: 'Card, image and title share layoutIds with their dialog counterparts. Motion measures both boxes (FLIP) and animates transform + scale-corrected border-radius.',
      perf: 'Layout animations are measured once per change, then run as transforms. Children use layout="position" to avoid scale distortion.',
      a11y: 'Real role="dialog" with focus trap, Esc to close, focus restored to the originating card, and body scroll lock.',
    },
  },
  {
    slug: 'reorder-list', category: 'physics', title: 'Layout Shift Smoothing', depth: 'sketch', layout: 'stage',
    blurb: 'Add, remove, shuffle and drag-to-reorder. Every layout shift animates instead of jumping.',
    libs: ['Motion'],
    playground: { kind: 'spring', controls: spring(500, 40, 1) },
    notes: {
      how: 'Reorder.Group/Reorder.Item for drag sorting; AnimatePresence with mode="popLayout" so exiting items leave the flow immediately and siblings glide into place.',
      perf: 'Layout projection uses transforms only; items are keyed by stable ids so React never remounts them.',
      a11y: 'Up/Down buttons on every row provide a non-drag reordering path.',
    },
  },
  {
    slug: 'magnetic-button', category: 'physics', title: 'Magnetic Buttons', depth: 'sketch', layout: 'stage',
    blurb: 'Buttons that lean toward the cursor, with a separate spring for the label (parallax inside the button).',
    libs: ['Motion'],
    playground: { kind: 'spring', controls: [...spring(180, 14, 0.4), range('strength', 'Pull strength', 0, 1, 0.05, 0.4)] },
    notes: {
      how: 'Pointer offset from the button centre feeds two useSpring MotionValues; the label gets 1.5× the offset for depth.',
      perf: MOTION_VALUES,
      a11y: 'Effect is pointer-only; keyboard focus shows a strong ring and no motion.',
    },
  },
  {
    slug: 'stateful-button', category: 'physics', title: 'Stateful Button Morph', depth: 'showcase', layout: 'stage',
    blurb: 'idle → loading → success / error. Width, icon and colour morph as one continuous object.',
    libs: ['Motion', 'SVG'],
    playground: { kind: 'spring', controls: spring(400, 30, 1) },
    notes: {
      how: 'A finite state machine drives variants; `layout` smooths the width change; the check mark is drawn with pathLength.',
      perf: 'Width change is layout-animated (transform + scale correction), not animated `width`.',
      a11y: 'aria-live="polite" announces each state; the button is aria-disabled while busy.',
    },
  },
  {
    slug: 'ripple', category: 'physics', title: 'Ripple Effects', depth: 'sketch', layout: 'stage',
    blurb: 'Material-style ink ripples that originate exactly at the pointer (or centre, for keyboard).',
    libs: ['Motion', 'CSS'],
    playground: { kind: 'tween', controls: tween(0.65, [0.2, 0.7, 0.3, 1]) },
    notes: {
      how: 'Each press appends a ripple {x, y, size} to local state; AnimatePresence removes it on complete.',
      perf: 'Ripples scale a pre-sized circle (transform) instead of animating width/height.',
      a11y: 'Keyboard activation spawns the ripple from the centre, so feedback is equal for all inputs.',
    },
  },
  {
    slug: 'tilt-card', category: 'physics', title: '3D Tilt & Glare', depth: 'sketch', layout: 'stage',
    blurb: 'Perspective tilt that follows the pointer, with a moving specular glare layer.',
    libs: ['Motion', 'CSS'],
    playground: { kind: 'spring', controls: [...spring(150, 18, 0.6), range('max', 'Max tilt', 2, 30, 1, 14, '°')] },
    notes: {
      how: 'useMotionValue for pointer position → useTransform to rotateX/rotateY and to the glare gradient position via useMotionTemplate.',
      perf: MOTION_VALUES,
      a11y: 'Tilt is disabled in reduced-motion mode; content remains fully legible flat.',
    },
  },
  {
    slug: 'staggered-menu', category: 'physics', title: 'Staggered Menu', depth: 'showcase', layout: 'stage',
    blurb: 'Mobile navigation: circular clip-path reveal, blurred backdrop, staggered links.',
    libs: ['Motion', 'CSS'],
    playground: { kind: 'spring', controls: [...spring(260, 24, 1), range('stagger', 'Stagger', 0, 0.2, 0.01, 0.06, 's')] },
    notes: {
      how: 'Parent variants orchestrate children with staggerChildren/delayChildren; the panel expands with an animated circle() clip-path.',
      perf: 'backdrop-filter is expensive, so the blur layer is only mounted while the menu is open.',
      a11y: 'aria-expanded on the toggle, Esc closes, focus moves into the menu and returns to the toggle.',
    },
  },
  {
    slug: 'modal-drawer', category: 'physics', title: 'Modal & Drawer', depth: 'sketch', layout: 'stage',
    blurb: 'Animated modal plus a bottom sheet you can drag down to dismiss.',
    libs: ['Motion'],
    playground: { kind: 'spring', controls: spring(380, 36, 1) },
    notes: {
      how: 'The drawer uses drag="y" with dragConstraints top:0 and closes when offset or velocity crosses a threshold.',
      perf: TRANSFORM_ONLY,
      a11y: 'Both are role="dialog" aria-modal with Esc-to-close and focus return.',
    },
  },
  {
    slug: 'command-palette', category: 'physics', title: 'Morphing Command Palette', depth: 'showcase', layout: 'stage',
    blurb: '⌘K palette that morphs out of its trigger, filters live and animates the highlight between rows.',
    libs: ['Motion'],
    playground: { kind: 'spring', controls: spring(500, 38, 1) },
    notes: {
      how: 'Trigger and palette share a layoutId; the active-row highlight is a single element with layoutId="hl" that slides between rows.',
      perf: 'Filtering changes the list; `layout` animates survivors while AnimatePresence handles the rest in popLayout mode.',
      a11y: 'Combobox pattern: aria-activedescendant, arrow keys, Enter, Esc. The list scroll uses data-lenis-prevent.',
    },
  },
  {
    slug: 'cursor-follower', category: 'physics', title: 'Fluid Cursor & Hover Traps', depth: 'showcase', layout: 'stage',
    blurb: 'A lagging cursor blob that stretches with velocity and snaps into “trap” targets.',
    libs: ['Motion'],
    playground: { kind: 'spring', controls: [...spring(350, 28, 0.5), range('stretch', 'Velocity stretch', 0, 1, 0.05, 0.5)] },
    notes: {
      how: 'Pointer → springs for x/y; velocity (useVelocity) drives scaleX and rotation so the blob smears in the direction of travel. Traps override the target with the element rect.',
      perf: `${MOTION_VALUES} Hidden automatically on touch devices (pointer: coarse).`,
      a11y: 'The native cursor stays visible; the blob is decorative (aria-hidden).',
    },
  },
  {
    slug: 'particle-trail', category: 'physics', title: 'Particle Trail', depth: 'sketch', layout: 'stage',
    blurb: 'A pooled particle tail following the pointer, drawn on a single 2D canvas.',
    libs: ['Canvas 2D'],
    playground: {
      kind: 'custom',
      controls: [range('rate', 'Spawn per move', 1, 12, 1, 4), range('life', 'Life', 0.2, 3, 0.1, 1.1, 's'), range('gravity', 'Gravity', -400, 800, 10, 120), range('size', 'Size', 1, 16, 0.5, 5)],
    },
    notes: {
      how: 'A fixed-size particle pool (object recycling, no allocation per frame) updated in a rAF loop with delta time.',
      perf: 'Canvas is DPR-capped by the device tier; the loop pauses offscreen and when the tab is hidden.',
      a11y: 'Decorative. In reduced-motion mode only a static cursor dot is drawn.',
    },
  },

  // ------------------------------------------------------------------ 02 SCROLL
  {
    slug: 'horizontal-pin', category: 'scroll', title: 'Pinned Horizontal Panels', depth: 'showcase', layout: 'scroll',
    blurb: 'Vertical scroll drives a horizontal track of panels, with nested per-panel animations.',
    libs: ['GSAP', 'ScrollTrigger', 'Lenis'],
    playground: { kind: 'scroll', controls: scroll(1) },
    notes: {
      how: 'The section pins while a tween moves the track by -(scrollWidth - innerWidth). Inner elements use containerAnimation so they trigger on their horizontal position.',
      perf: 'Lenis is driven by gsap.ticker (one rAF loop). invalidateOnRefresh recalculates widths on resize.',
      a11y: `${RM_GSAP} In reduced mode the panels simply stack vertically.`,
    },
  },
  {
    slug: 'split-text', category: 'scroll', title: 'SplitText Reveals', depth: 'showcase', layout: 'scroll',
    blurb: 'Char, word and line reveals with masks, plus skew driven by scroll velocity.',
    libs: ['GSAP', 'SplitText', 'ScrollTrigger'],
    playground: { kind: 'scroll', controls: [...scroll(0), select('split', 'Split by', ['chars', 'words', 'lines'], 'lines')] },
    notes: {
      how: 'SplitText with mask: "lines" and autoSplit re-splits on resize/font load. Skew uses ScrollTrigger.getVelocity() fed through gsap.quickTo.',
      perf: 'quickTo reuses one tween instead of creating a new tween every scroll event.',
      a11y: 'SplitText adds aria-label to the parent and aria-hidden to the pieces, so screen readers get the sentence once.',
    },
  },
  {
    slug: 'parallax-layers', category: 'scroll', title: 'Himalayan Parallax', depth: 'sketch', layout: 'scroll',
      blurb: 'Sunrise over the Himalaya: five mountain ranges moving at five scroll speeds.',
    libs: ['GSAP', 'ScrollTrigger'],
    playground: { kind: 'scroll', controls: [...scroll(0), range('depth', 'Depth multiplier', 0, 2, 0.05, 1)] },
    notes: {
      how: 'Each layer has data-speed; one scrubbed timeline translates layers by speed × distance.',
      perf: 'Layers are promoted with will-change: transform only while the section is active.',
      a11y: `${RM_GSAP}`,
    },
  },
  {
    slug: 'zoom-reveal', category: 'scroll', title: 'Zoom-on-Scroll Reveal', depth: 'sketch', layout: 'scroll',
    blurb: 'A small framed image expands to full-bleed while the headline splits apart.',
    libs: ['GSAP', 'ScrollTrigger'],
    playground: { kind: 'scroll', controls: scroll(1) },
    notes: {
      how: 'clip-path inset() and image scale are scrubbed together inside a pinned section.',
      perf: 'clip-path on a composited layer is cheap in Chromium/WebKit; the image itself only scales.',
      a11y: RM_GSAP,
    },
  },
  {
    slug: 'highlight-fill', category: 'scroll', title: 'Highlight Fill', depth: 'sketch', layout: 'scroll',
    blurb: 'Paragraph words light up one by one as you read, with a marker highlight on key phrases.',
    libs: ['GSAP', 'SplitText', 'ScrollTrigger'],
    playground: { kind: 'scroll', controls: scroll(0.5) },
    notes: {
      how: 'Words split with SplitText, opacity scrubbed with stagger; highlights animate background-size.',
      perf: 'Opacity only for words; background-size on a handful of <mark>s.',
      a11y: 'Text is always present and readable; reduced mode shows it fully lit.',
    },
  },
  {
    slug: 'velocity-marquee', category: 'scroll', title: 'Kinetic Marquee', depth: 'sketch', layout: 'scroll',
    blurb: 'Infinite running text that speeds up and reverses with scroll direction.',
    libs: ['GSAP', 'ScrollTrigger'],
    playground: { kind: 'custom', controls: [range('speed', 'Base speed', 5, 60, 1, 20, 's/loop'), range('boost', 'Scroll boost', 0, 10, 0.5, 4)] },
    notes: {
      how: 'Seamless loop = content duplicated once, xPercent -50 repeat -1. ScrollTrigger onUpdate sets timeScale from velocity, then eases back.',
      perf: 'A single tween per row; timeScale changes are free.',
      a11y: 'Paused in reduced-motion mode and has a pause button (WCAG 2.2.2).',
    },
  },
  {
    slug: 'svg-draw', category: 'scroll', title: 'SVG Path Drawing', depth: 'showcase', layout: 'scroll',
    blurb: 'A route traces itself as you scroll, with a progress indicator and waypoint pops.',
    libs: ['GSAP', 'DrawSVG', 'ScrollTrigger'],
    playground: { kind: 'scroll', controls: scroll(0.6) },
    notes: {
      how: 'DrawSVGPlugin animates stroke-dasharray/offset from "0%" to "100%"; MotionPath-free dot follows via getPointAtLength.',
      perf: 'Stroke drawing repaints only the SVG; vector-effect: non-scaling-stroke keeps it crisp.',
      a11y: 'The SVG has a <title>; reduced mode shows the full path.',
    },
  },
  {
    slug: 'svg-morph', category: 'scroll', title: 'SVG Shape Morphing', depth: 'sketch', layout: 'scroll',
    blurb: 'Circle → star → blob → polygon, scrubbed by scroll with MorphSVG.',
    libs: ['GSAP', 'MorphSVG', 'ScrollTrigger'],
    playground: { kind: 'scroll', controls: [...scroll(1), select('mapping', 'Point mapping', ['size', 'position', 'complexity'], 'size')] },
    notes: {
      how: 'MorphSVGPlugin interpolates between shapes with different point counts; shapeIndex "auto" picks the best rotation.',
      perf: 'The path is re-computed per frame — keep point counts modest (< 200).',
      a11y: RM_GSAP,
    },
  },
  {
    slug: 'flip-grid', category: 'scroll', title: 'Flip Layout Grid', depth: 'showcase', layout: 'stage',
    blurb: 'Switch grid ↔ list and filter categories; GSAP Flip animates every item to its new box.',
    libs: ['GSAP', 'Flip'],
    playground: { kind: 'tween', controls: tween(0.7, [0.65, 0, 0.35, 1]) },
    notes: {
      how: 'Flip.getState() → change classes / DOM → Flip.from(state, {absolute, nested, onEnter, onLeave}).',
      perf: 'Flip converts the layout change into transforms; absolute: true avoids layout thrash during the tween.',
      a11y: 'Filter buttons are aria-pressed toggles; reduced mode swaps instantly.',
    },
  },
  {
    slug: 'stacking-cards', category: 'scroll', title: 'Stacking Cards', depth: 'sketch', layout: 'scroll',
    blurb: 'Sticky cards that scale down and dim as the next one slides over them.',
    libs: ['GSAP', 'ScrollTrigger', 'CSS'],
    playground: { kind: 'scroll', controls: scroll(0) },
    notes: {
      how: 'position: sticky does the stacking for free; ScrollTrigger only scrubs scale/brightness of the covered card.',
      perf: 'CSS handles the pinning — no JS pin spacers.',
      a11y: 'Cards are regular articles in reading order.',
    },
  },
  {
    slug: 'observer-slides', category: 'scroll', title: 'Observer Fullscreen Slides', depth: 'sketch', layout: 'stage',
    blurb: 'Wheel, touch and keys step through full-screen slides with one normalised gesture API.',
    libs: ['GSAP', 'Observer', 'SplitText'],
    playground: { kind: 'tween', controls: tween(1.1, [0.76, 0, 0.24, 1]) },
    notes: {
      how: 'Observer.create({type: "wheel,touch,pointer"}) with a busy flag; each slide change is a timeline with SplitText char reveal.',
      perf: 'Only two slides are visible at a time; others are visibility:hidden.',
      a11y: 'Arrow keys and buttons work too; slide region is aria-live.',
    },
  },
  {
    slug: 'text-scramble', category: 'scroll', title: 'Text Scramble / Decode', depth: 'sketch', layout: 'stage',
    blurb: 'Hacker-style decode effects with ScrambleText — on hover, on load and on a loop.',
    libs: ['GSAP', 'ScrambleText'],
        playground: { kind: 'custom', controls: [range('duration', 'Duration', 0.2, 3, 0.1, 1.2, 's'), select('chars', 'Character set', ['upperCase', 'lowerCase', '01', '!<>-_\\/[]{}—=+*^?#', 'कखगघचछजझटठडढतथदधनपफबभमयरलवशसह'], 'upperCase'), range('speed', 'Speed', 0.1, 2, 0.1, 0.6)] },
    notes: {
      how: 'ScrambleTextPlugin replaces characters with random ones from a set and reveals the target left to right.',
      perf: 'Updates text nodes only — tiny layout cost on a fixed-width monospace container.',
      a11y: 'aria-label holds the final text so screen readers never hear the gibberish.',
    },
  },
  {
    slug: 'image-sequence', category: 'scroll', title: 'Apple-Style Frame Scrub', depth: 'showcase', layout: 'scroll',
    blurb: '96 pre-rendered frames drawn to canvas and scrubbed by scroll position, with text beats.',
    libs: ['GSAP', 'ScrollTrigger', 'Canvas 2D'],
    playground: { kind: 'scroll', controls: scroll(0.5) },
    notes: {
      how: 'Frames are decoded up-front into ImageBitmaps; a scrubbed tween on {frame} redraws the canvas with object-fit: cover math.',
      perf: 'createImageBitmap decodes off the main thread; only drawImage runs per frame. Low tier loads every 2nd frame.',
      a11y: 'Reduced mode shows a single key frame; text beats are real headings.',
    },
  },

  // ------------------------------------------------------------------ 03 WEBGL
  {
    slug: 'glass-hero', category: 'webgl', title: 'Glass Hero', depth: 'showcase', layout: 'stage',
    blurb: 'Floating transmission-glass shapes that tilt toward the cursor, lit by a procedural environment.',
    libs: ['R3F', 'drei', 'Three.js'],
    playground: {
      kind: 'shader',
      controls: [range('thickness', 'Thickness', 0, 3, 0.05, 1.2), range('ior', 'IOR', 1, 2.3, 0.01, 1.5), range('chroma', 'Chromatic aberration', 0, 1, 0.01, 0.06), range('roughness', 'Roughness', 0, 1, 0.01, 0.05), range('tilt', 'Cursor tilt', 0, 1, 0.05, 0.4)],
    },
    notes: {
      how: 'MeshTransmissionMaterial (drei) with a Lightformer-built <Environment> — no HDR download. The group lerps toward pointer rotation each frame.',
      perf: `${SHARED_CANVAS} Transmission samples = 6 on low tier, 10 otherwise; resolution scales with tier.`,
      a11y: RM_3D,
    },
  },
  {
    slug: 'scroll-disassembly', category: 'webgl', title: 'Scroll-Driven Disassembly', depth: 'showcase', layout: 'scroll',
    blurb: 'A procedural device explodes into parts as you scroll, while the camera orbits around it.',
    libs: ['R3F', 'drei', 'GSAP', 'ScrollTrigger'],
    playground: { kind: 'scroll', controls: [...scroll(1), range('explode', 'Explode distance', 0.5, 4, 0.1, 2)] },
    notes: {
      how: 'ScrollTrigger writes progress into a ref; useFrame lerps each part along its own explode vector and the camera along an arc. No React state per frame.',
      perf: `${SHARED_CANVAS} Parts share materials; geometry is created once with useMemo.`,
      a11y: 'Reduced mode shows the exploded state statically with labels.',
    },
  },
  {
    slug: 'particle-swirl', category: 'webgl', title: 'Particle Swirl', depth: 'showcase', layout: 'stage',
    blurb: '60k GPU particles swirl in a galaxy; click to blast them outward by depth.',
    libs: ['R3F', 'GLSL'],
    playground: { kind: 'shader', controls: [range('speed', 'Swirl speed', 0, 3, 0.05, 0.6), range('spread', 'Spread', 0.2, 3, 0.05, 1), range('size', 'Point size', 1, 12, 0.5, 4), color('colorA', 'Inner colour', '#ff6ec7'), color('colorB', 'Outer colour', '#5b8cff')] },
    notes: {
      how: 'All motion happens in the vertex shader from uTime; the click “blast” is a single uniform animated with a spring-like decay.',
      perf: `${SHARED_CANVAS} Zero per-particle CPU work. Count drops to 15k on low tier.`,
      a11y: RM_3D,
    },
  },
  {
    slug: 'cursor-blob', category: 'webgl', title: 'Cursor-Reactive Shader Blob', depth: 'sketch', layout: 'stage',
    blurb: 'An icosphere whose vertices ripple outward from the cursor, with a normal-based palette.',
    libs: ['R3F', 'GLSL'],
    playground: { kind: 'shader', controls: [range('strength', 'Displacement', 0, 1, 0.01, 0.25), range('frequency', 'Frequency', 1, 30, 0.5, 12), range('speed', 'Speed', 0, 6, 0.1, 2)] },
    notes: {
      how: 'Custom ShaderMaterial; pointer is smoothed with Vector2.lerp and passed as a uniform.',
      perf: `${SHARED_CANVAS} Playground writes straight into uniforms.value — zero React renders while dragging a slider.`,
      a11y: RM_3D,
    },
  },
  {
    slug: 'camera-orbit', category: 'webgl', title: 'Scroll Camera Flythrough', depth: 'sketch', layout: 'scroll',
    blurb: 'The camera flies along a spline through a field of monoliths as you scroll.',
    libs: ['R3F', 'GSAP', 'ScrollTrigger'],
    playground: { kind: 'scroll', controls: scroll(1.5) },
    notes: {
      how: 'CatmullRomCurve3 path; progress from ScrollTrigger → curve.getPointAt(p); camera looks slightly ahead on the curve.',
      perf: `${SHARED_CANVAS} Monoliths are one InstancedMesh (1 draw call).`,
      a11y: RM_3D,
    },
  },
  {
    slug: 'postfx-pipeline', category: 'webgl', title: 'Bloom, DoF & Shadows', depth: 'showcase', layout: 'stage',
    blurb: 'Dynamic soft shadows plus a bloom + depth-of-field + vignette post-processing pipeline.',
    libs: ['R3F', 'Postprocessing', 'drei'],
    playground: { kind: 'shader', controls: [range('bloom', 'Bloom intensity', 0, 4, 0.05, 1.4), range('threshold', 'Bloom threshold', 0, 1, 0.01, 0.6), range('focus', 'Focus distance', 1, 15, 0.1, 6, 'm'), range('bokeh', 'Bokeh scale', 0, 8, 0.1, 3), toggle('dof', 'Depth of field', true)] },
    notes: {
      how: 'EffectComposer (@react-three/postprocessing) merges effects into as few passes as possible. Shadows come from a single directional light with a tight shadow camera.',
      perf: 'This demo uses its own Canvas on purpose: full-screen composers do not work inside scissored Views. It is gated to the high tier; mid/low get bloom only / no post FX.',
      a11y: RM_3D,
    },
  },
  {
    slug: 'rapier-drop', category: 'webgl', title: 'Rigid-Body Physics', depth: 'sketch', layout: 'stage',
    blurb: 'Click to rain rigid bodies into a bowl. Real collisions via Rapier (WASM).',
    libs: ['R3F', 'Rapier'],
    playground: { kind: 'custom', controls: [range('restitution', 'Bounciness', 0, 1.2, 0.05, 0.5), range('gravity', 'Gravity', -30, 0, 0.5, -9.81), range('batch', 'Bodies per click', 1, 30, 1, 8)] },
    notes: {
      how: '@react-three/rapier runs the Rapier WASM world; bodies are capped at 150 and the oldest are recycled.',
      perf: `${SHARED_CANVAS} Physics steps at a fixed timestep independent of frame rate.`,
      a11y: 'A “Drop” button mirrors the click interaction; reduced mode pauses the simulation.',
    },
  },
  {
    slug: 'instanced-wave', category: 'webgl', title: 'Instanced Wave Field', depth: 'sketch', layout: 'stage',
    blurb: 'Up to 40,000 cubes in one draw call, animated by a travelling wave.',
    libs: ['R3F', 'GLSL'],
    playground: { kind: 'shader', controls: [select('count', 'Instances', ['2500', '10000', '22500', '40000'], '10000'), range('amp', 'Amplitude', 0, 2, 0.05, 0.6), range('speed', 'Speed', 0, 5, 0.1, 1.5)] },
    notes: {
      how: 'InstancedMesh with per-instance offsets baked into an attribute; the wave is computed in the vertex shader via onBeforeCompile.',
      perf: `${SHARED_CANVAS} 1 draw call regardless of count — watch the HUD.`,
      a11y: RM_3D,
    },
  },
  {
    slug: 'webgpu-tsl', category: 'webgl', title: 'WebGPU + TSL (Stretch)', depth: 'sketch', layout: 'stage',
    blurb: 'Three.js WebGPURenderer with a node material written in TSL. Falls back to WebGL2 automatically.',
    libs: ['Three.js', 'TSL'],
    playground: { kind: 'shader', controls: [range('speed', 'Speed', 0, 4, 0.1, 1), range('scale', 'Pattern scale', 1, 20, 0.5, 6)] },
    notes: {
      how: 'three/webgpu + three/tsl: the colour is a node graph (sin/uv/time) compiled to WGSL or GLSL depending on the backend.',
      perf: 'Separate renderer by necessity (WebGPU needs its own context). Badge shows which backend actually ran.',
      a11y: RM_3D,
    },
  },

  // ------------------------------------------------------------------ 04 VECTOR
  {
    slug: 'rive-login', category: 'vector', title: 'Rive State-Machine Character', depth: 'showcase', layout: 'stage',
    blurb: 'A login character that tracks your typing, covers its eyes for passwords and reacts to success/fail.',
    libs: ['Rive', 'Motion', 'SVG'],
    playground: { kind: 'custom', controls: [range('lookScale', 'Look sensitivity', 0.2, 3, 0.1, 1), toggle('forceFallback', 'Force code fallback', false)] },
    notes: {
      how: 'useRive + useStateMachineInput wire numeric (look), boolean (checking, handsUp) and trigger (success, fail) inputs. If /public/rive/login.riv is missing, a Motion/SVG character implements the same state machine in code.',
      perf: 'Rive renders on its own canvas with its WASM runtime; it pauses when offscreen.',
      a11y: 'The form is a normal accessible form; the character is decorative (aria-hidden) and static in reduced mode.',
    },
  },
  {
    slug: 'lottie-scroll', category: 'vector', title: 'Scroll-Scrubbed Lottie', depth: 'showcase', layout: 'scroll',
    blurb: 'A Lottie timeline whose playhead is bound to scroll position (goToAndStop per frame).',
    libs: ['Lottie', 'GSAP', 'ScrollTrigger'],
    playground: { kind: 'scroll', controls: [...scroll(0.8), select('renderer', 'Renderer', ['svg', 'canvas'])] },
    notes: {
      how: 'lottie-web with autoplay:false; a ScrollTrigger scrub tween drives {frame} and calls goToAndStop(frame, true).',
      perf: 'The canvas renderer is faster for many shapes; SVG stays crisp and inspectable. Toggle and compare in the HUD.',
      a11y: 'Reduced mode jumps to the final frame.',
    },
  },
  {
    slug: 'lottie-toggles', category: 'vector', title: 'Lottie State Toggles', depth: 'sketch', layout: 'stage',
    blurb: 'Menu ↔ close, like-heart burst and checkbox — each Lottie plays forward/back as a toggle.',
    libs: ['Lottie'],
    playground: { kind: 'custom', controls: [range('speed', 'Playback speed', 0.25, 3, 0.05, 1)] },
    notes: {
      how: 'playSegments([0, end]) / playSegments([end, 0]) or setDirection(-1) for reversible toggles.',
      perf: 'Each animation is ~2–9 KB of JSON; lottie-web is loaded once and shared.',
      a11y: 'Real <button aria-pressed>; reduced mode jumps straight to the end frame.',
    },
  },

  // ------------------------------------------------------------------ 05 MEDIA
  {
    slug: 'hover-distortion', category: 'media', title: 'Image Hover Distortion', depth: 'showcase', layout: 'stage',
    blurb: 'WebGL image planes that wave, ripple or split RGB channels under the cursor.',
    libs: ['R3F', 'GLSL', 'drei'],
    playground: { kind: 'shader', controls: [select('mode', 'Effect', ['wave', 'ripple', 'rgb-split']), range('strength', 'Strength', 0, 1, 0.01, 0.5), range('frequency', 'Frequency', 1, 40, 0.5, 10), range('radius', 'Cursor radius', 0.05, 1, 0.01, 0.35)] },
    notes: {
      how: 'Each card is a plane in its own <View>; UVs are displaced in the fragment shader by distance to the (smoothed) hover point, gated by an animated uHover.',
      perf: `${SHARED_CANVAS} Textures are loaded once via useTexture and shared.`,
      a11y: 'Real <img> alt text sits underneath for screen readers; reduced mode keeps the image static.',
    },
  },
  {
    slug: 'liquid-transition', category: 'media', title: 'Liquid Image Transition', depth: 'showcase', layout: 'stage',
    blurb: 'Noise-displaced liquid morph between images — click, arrow keys or autoplay.',
    libs: ['R3F', 'GLSL', 'GSAP'],
    playground: { kind: 'shader', controls: [range('intensity', 'Intensity', 0, 1, 0.01, 0.4), range('duration', 'Duration', 0.3, 3, 0.05, 1.4, 's'), range('scale', 'Noise scale', 0.5, 10, 0.1, 3), toggle('autoplay', 'Autoplay', false)] },
    notes: {
      how: 'Fragment shader mixes texA/texB with a noise-shaped threshold; GSAP tweens uProgress, then textures swap.',
      perf: `${SHARED_CANVAS} Only one uniform changes per frame.`,
      a11y: 'Prev/next buttons, live region with the image caption; reduced mode crossfades.',
    },
  },
  {
    slug: 'video-mask', category: 'media', title: 'SVG Mask over Live Video', depth: 'sketch', layout: 'stage',
    blurb: 'Knockout typography and a cursor-driven spotlight reveal a playing video.',
    libs: ['SVG', 'Video', 'Motion', 'CSS'],
    playground: { kind: 'custom', controls: [select('mask', 'Mask', ['text', 'spotlight', 'blob']), range('radius', 'Spotlight radius', 40, 400, 5, 160, 'px')] },
    notes: {
      how: 'CSS mask-image with an inline SVG (text) or a radial-gradient at CSS variables updated from pointer (spotlight).',
      perf: 'Pointer updates only write CSS custom properties — no React renders.',
      a11y: 'Video is muted, has no essential content and pauses in reduced mode; a play/pause button is provided.',
    },
  },
  {
    slug: 'clip-path', category: 'media', title: 'Animated clip-path', depth: 'sketch', layout: 'stage',
    blurb: 'Circle, polygon, inset and wipe reveals — interpolated by the browser.',
    libs: ['Motion', 'CSS'],
    playground: { kind: 'tween', controls: tween(0.9, [0.77, 0, 0.18, 1]) },
    notes: {
      how: 'Motion animates clipPath strings with matching point counts, e.g. polygon(…) → polygon(…) with the same number of vertices.',
      perf: 'clip-path animations are paint-only in most engines; keep the element on its own layer.',
      a11y: 'Content under the clip is in the DOM and readable at all times.',
    },
  },
  {
    slug: 'video-scrub', category: 'media', title: 'Video Scroll Scrub', depth: 'sketch', layout: 'scroll',
    blurb: 'Scroll sets video.currentTime directly — smooth because every frame is a keyframe.',
    libs: ['Video', 'GSAP', 'ScrollTrigger'],
    playground: { kind: 'scroll', controls: scroll(0.4) },
    notes: {
      how: 'Encoded with ffmpeg -g 1 (all-intra). A scrubbed tween updates a proxy and writes currentTime inside requestVideoFrameCallback-friendly rAF.',
      perf: 'Normal GOP videos stutter on seek; all-keyframe files are bigger but seek instantly. Compare with the Apple-style canvas scrub.',
      a11y: 'Muted, no audio track; reduced mode shows a poster.',
    },
  },
  {
    slug: 'noise-gradient', category: 'media', title: 'Generative Noise Gradient', depth: 'sketch', layout: 'stage',
    blurb: 'A full-bleed flowing gradient background from domain-warped simplex noise.',
    libs: ['R3F', 'GLSL'],
    playground: { kind: 'shader', controls: [range('speed', 'Speed', 0, 2, 0.01, 0.25), range('scale', 'Scale', 0.2, 5, 0.05, 1.4), range('warp', 'Warp', 0, 3, 0.05, 1.2), color('c1', 'Colour A', '#120b2e'), color('c2', 'Colour B', '#ff4fa3'), color('c3', 'Colour C', '#4f7bff')] },
    notes: {
      how: 'Fragment-only shader on a fullscreen plane; fbm(p + fbm(p)) domain warping.',
      perf: `${SHARED_CANVAS} Low tier renders at 0.5× resolution — backgrounds don’t need retina.`,
      a11y: RM_3D,
    },
  },
   {
     slug: 'dhaka-weave', category: 'media', title: 'Dhaka Weave Shader', depth: 'showcase', layout: 'stage',
     blurb: 'A generative Nepali Dhaka textile: diamonds, chevrons and stripes woven thread by thread in a fragment shader.',
     libs: ['R3F', 'GLSL'],
     playground: { kind: 'shader', controls: [range('speed', 'Drift speed', 0, 2, 0.05, 0.4), range('threads', 'Thread density', 20, 200, 1, 90), range('weave', 'Weave texture', 0, 1, 0.05, 0.8)] },
     notes: {
       how: 'UVs snap to a thread grid, then band into diamond, chevron and stripe motifs in the traditional red/black/cream/orange palette.',
       perf: `${SHARED_CANVAS} Pure math per pixel — no textures.`,
       a11y: RM_3D,
     },
  },

  // ------------------------------------------------------------------ 06 SIMS
  {
    slug: 'fluid-sim', category: 'sims', title: 'Fluid Simulation (Worker)', depth: 'showcase', layout: 'stage',
    blurb: 'Stable-fluids solver running in a Web Worker, rendering to an OffscreenCanvas.',
    libs: ['Web Worker', 'Canvas 2D'],
    playground: { kind: 'custom', controls: [range('viscosity', 'Viscosity', 0, 0.001, 0.00001, 0.00002), range('dissipation', 'Dye dissipation', 0.9, 1, 0.001, 0.985), range('force', 'Force', 1, 40, 1, 12), range('radius', 'Splat radius', 1, 8, 0.5, 3)] },
    notes: {
      how: 'Jos Stam “Stable Fluids”: advect → diffuse → project (Gauss-Seidel) on a 128² grid. Canvas control is transferred to the worker with transferControlToOffscreen().',
      perf: 'The main thread only posts pointer events — scroll and UI stay at 60fps even if the solver drops frames. Falls back to main thread if OffscreenCanvas is unsupported.',
      a11y: 'Decorative; reduced mode renders a single still frame.',
    },
  },
  {
    slug: 'cloth-sim', category: 'sims', title: 'Prayer Flags (Verlet Cloth)', depth: 'sketch', layout: 'stage',
     blurb: 'Nepali prayer flags on a sagging rope. Wind makes them flutter; drag, cut or pull hard to tear them.',
    libs: ['Canvas 2D'],
    playground: { kind: 'custom', controls: [range('gravity', 'Gravity', 0, 2000, 10, 900), range('iterations', 'Constraint iterations', 1, 12, 1, 4), range('tear', 'Tear distance', 20, 200, 1, 60), range('wind', 'Wind', 0, 400, 5, 140)] },
    notes: {
      how: 'Position-based Verlet integration with distance constraints relaxed N times per frame; constraints over the tear distance are removed.',
      perf: 'Fixed 60Hz substep with accumulator; 30Hz on low tier.',
      a11y: '“Reset” and “Wind gust” buttons provide non-pointer interaction.',
    },
  },
  {
    slug: 'flow-field', category: 'sims', title: 'Flow Field', depth: 'sketch', layout: 'stage',
    blurb: 'Thousands of particles following a noise-driven vector field, leaving silky trails.',
    libs: ['Canvas 2D'],
    playground: { kind: 'custom', controls: [range('count', 'Particles', 500, 8000, 100, 3000), range('scale', 'Noise scale', 0.0005, 0.01, 0.0001, 0.003), range('speed', 'Speed', 0.2, 4, 0.1, 1.2), range('fade', 'Trail fade', 0.01, 0.3, 0.01, 0.06)] },
    notes: {
      how: 'Each frame paints a translucent rect (trail fade), then particles step along angle = noise(x, y, t) × τ.',
      perf: 'Typed arrays (Float32Array) for particle state; one path per frame for all particles.',
      a11y: 'Decorative; reduced mode draws one static frame.',
    },
  },
  {
    slug: 'audio-visualizer', category: 'sims', title: 'Audio Visualizer', depth: 'showcase', layout: 'stage',
    blurb: 'Web Audio AnalyserNode driving 2D bars, waveform, radial and a 3D mesh. Built-in synth, mic or your file.',
    libs: ['Web Audio', 'Canvas 2D', 'R3F'],
    playground: { kind: 'custom', controls: [select('mode', 'Visual', ['bars', 'wave', 'radial', '3d']), range('smoothing', 'Smoothing', 0, 0.95, 0.01, 0.8), range('gain', 'Visual gain', 0.2, 3, 0.05, 1.2)] },
    notes: {
      how: 'Source (synth sequencer / mic / file) → AnalyserNode → destination. getByteFrequencyData into a reused Uint8Array each frame.',
      perf: 'One analyser, one buffer, zero allocations per frame. The 3D mode writes FFT into a DataTexture read by the vertex shader.',
      a11y: 'Audio never autoplays (browser policy + WCAG 1.4.2); explicit play/stop and volume controls.',
    },
  },

  // ------------------------------------------------------------------ 07 NATIVE
  {
    slug: 'view-transitions', category: 'native', title: 'View Transitions API', depth: 'showcase', layout: 'stage',
    blurb: 'Gallery → detail morph using document.startViewTransition and view-transition-name.',
    libs: ['View Transitions', 'CSS'],
    playground: { kind: 'tween', controls: tween(0.45, [0.2, 0.8, 0.2, 1]) },
    notes: {
      how: 'flushSync inside startViewTransition so React commits the DOM change synchronously; shared elements get matching view-transition-name.',
      perf: 'The browser snapshots old/new states and animates them on the compositor. Zero JS animation libraries.',
      a11y: 'Unsupported browsers get an instant swap. Reduced mode disables it via @media (prefers-reduced-motion).',
    },
  },
  {
    slug: 'css-scroll-timeline', category: 'native', title: 'CSS Scroll-Driven Animations', depth: 'showcase', layout: 'scroll',
    blurb: 'animation-timeline: view() and scroll() — reveals, progress bar and parallax with no JavaScript.',
    libs: ['CSS'],
    notes: {
      how: 'Keyframes bound to view() with animation-range: entry/exit, and a reading-progress bar on scroll(root).',
      perf: 'Runs on the compositor thread — keeps animating even when the main thread is blocked (try the “Block main thread” button).',
      a11y: '@supports fallback shows everything static; reduced mode removes the timelines.',
    },
  },
  {
    slug: 'four-engines', category: 'native', title: 'Same Effect, 4 Engines', depth: 'showcase', layout: 'stage',
    blurb: 'One stagger animation built in CSS, WAAPI, Motion and GSAP — side by side, with main-thread stress test.',
    libs: ['CSS', 'WAAPI', 'Motion', 'GSAP'],
    playground: { kind: 'tween', controls: tween(1, [0.34, 1.56, 0.64, 1]) },
    notes: {
      how: 'Identical keyframes, duration, easing and stagger in each engine; replay triggers all four together.',
      perf: 'CSS and WAAPI transforms can run on the compositor; JS engines tick on the main thread. The stress button blocks the main thread for 800 ms so you can see the difference.',
      a11y: 'All four respect the reduced-motion flag.',
    },
  },
  {
    slug: 'starting-style', category: 'native', title: '@starting-style Entry/Exit', depth: 'sketch', layout: 'stage',
    blurb: 'Popover and <dialog> entry/exit animations in pure CSS, including display:none transitions.',
    libs: ['CSS'],
    playground: { kind: 'tween', controls: tween(0.35, [0.2, 0.9, 0.3, 1.2]) },
    notes: {
      how: '@starting-style defines the from-state on insertion; transition-behavior: allow-discrete lets display and overlay transition.',
      perf: 'No JS at all — the top layer and animations are handled by the browser.',
      a11y: 'Native popover/dialog give focus management and Esc handling for free.',
    },
  },
];

// ---------- helpers ----------
export const demoBySlug = new Map(demos.map((d) => [d.slug, d]));
export const categoryById = new Map(categories.map((c) => [c.id, c]));
export const demosIn = (id: CategoryId) => demos.filter((d) => d.category === id);
export const isCategory = (id: string): id is CategoryId => categoryById.has(id as CategoryId);

export function neighbours(slug: string) {
  const i = demos.findIndex((d) => d.slug === slug);
  return { prev: demos[(i - 1 + demos.length) % demos.length], next: demos[(i + 1) % demos.length] };
}

export const allLibs = Array.from(new Set(demos.flatMap((d) => d.libs))).sort();
