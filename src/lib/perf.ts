// Mutable, render-free stats bag. Writers (GLStats inside any Canvas) and the
// reader (PerfHUD's own rAF loop) never go through React state.
export const glStats = {
  active: false,
  calls: 0,
  triangles: 0,
  points: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
  lastUpdate: 0,
};
