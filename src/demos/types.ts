// Shared types for the demo registry. Kept dependency-free so both server
// components (routing, metadata, static params) and client code can import it.

export type CategoryId = 'physics' | 'scroll' | 'webgl' | 'vector' | 'media' | 'sims' | 'native';

export type Lib =
  | 'Motion'
  | 'GSAP'
  | 'ScrollTrigger'
  | 'SplitText'
  | 'Flip'
  | 'Observer'
  | 'MorphSVG'
  | 'DrawSVG'
  | 'ScrambleText'
  | 'Lenis'
  | 'R3F'
  | 'drei'
  | 'Three.js'
  | 'GLSL'
  | 'TSL'
  | 'Postprocessing'
  | 'Rapier'
  | 'Rive'
  | 'Lottie'
  | 'Canvas 2D'
  | 'Web Worker'
  | 'Web Audio'
  | 'CSS'
  | 'SVG'
  | 'WAAPI'
  | 'View Transitions'
  | 'Video';

export type Control =
  | { type: 'range'; key: string; label: string; min: number; max: number; step: number; default: number; unit?: string }
  | { type: 'select'; key: string; label: string; options: string[]; default: string }
  | { type: 'toggle'; key: string; label: string; default: boolean }
  | { type: 'color'; key: string; label: string; default: string };

/**
 * spring  → stiffness/damping/mass/velocity + live curve graph + export
 * tween   → duration + cubic-bezier editor + export
 * scroll  → Lenis lerp (applied live to the global instance) + scrub + markers
 * shader  → uniforms (written straight into `uniforms.x.value`, no re-render)
 * custom  → whatever the demo declares
 */
export type PlaygroundKind = 'spring' | 'tween' | 'scroll' | 'shader' | 'custom';

export type DemoMeta = {
  slug: string;
  category: CategoryId;
  title: string;
  blurb: string;
  libs: Lib[];
  /** showcase = flagship, fully polished. sketch = small honest experiment. */
  depth: 'showcase' | 'sketch';
  /** stage = boxed canvas-like frame · scroll = full-width, page scrolls through it */
  layout: 'stage' | 'scroll';
  playground?: { kind: PlaygroundKind; controls: Control[] };
  notes: { how: string; perf: string; a11y: string };
};

export type Category = {
  id: CategoryId;
  index: string;
  title: string;
  tagline: string;
  hue: number;
};
