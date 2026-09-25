// Jos Stam, "Real-Time Fluid Dynamics for Games" (2003) — stable fluids on a
// small grid with RGB dye. Pure TS, no DOM: runs in a Worker or on the main thread.

export type FluidParams = { viscosity: number; dissipation: number; force: number; radius: number };

export function createFluid(N = 128) {
  const S = (N + 2) * (N + 2);
  const IX = (i: number, j: number) => i + (N + 2) * j;
  const f = () => new Float32Array(S);
  let u = f(), v = f(), u0 = f(), v0 = f();
  const dye = [f(), f(), f()];
  const dye0 = [f(), f(), f()];
  const params: FluidParams = { viscosity: 0.00002, dissipation: 0.985, force: 12, radius: 3 };

  function setBnd(b: number, x: Float32Array) {
    for (let i = 1; i <= N; i++) {
      x[IX(0, i)] = b === 1 ? -x[IX(1, i)] : x[IX(1, i)];
      x[IX(N + 1, i)] = b === 1 ? -x[IX(N, i)] : x[IX(N, i)];
      x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
      x[IX(i, N + 1)] = b === 2 ? -x[IX(i, N)] : x[IX(i, N)];
    }
    x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
    x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
    x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
    x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
  }

  function linSolve(b: number, x: Float32Array, x0: Float32Array, a: number, c: number, iters = 16) {
    const inv = 1 / c;
    for (let k = 0; k < iters; k++) {
      for (let j = 1; j <= N; j++)
        for (let i = 1; i <= N; i++)
          x[IX(i, j)] = (x0[IX(i, j)] + a * (x[IX(i - 1, j)] + x[IX(i + 1, j)] + x[IX(i, j - 1)] + x[IX(i, j + 1)])) * inv;
      setBnd(b, x);
    }
  }

  const diffuse = (b: number, x: Float32Array, x0: Float32Array, diff: number, dt: number) => {
    const a = dt * diff * N * N;
    linSolve(b, x, x0, a, 1 + 4 * a);
  };

  function advect(b: number, d: Float32Array, d0: Float32Array, uu: Float32Array, vv: Float32Array, dt: number) {
    const dt0 = dt * N;
    for (let j = 1; j <= N; j++)
      for (let i = 1; i <= N; i++) {
        let x = i - dt0 * uu[IX(i, j)];
        let y = j - dt0 * vv[IX(i, j)];
        x = Math.min(N + 0.5, Math.max(0.5, x));
        y = Math.min(N + 0.5, Math.max(0.5, y));
        const i0 = x | 0, j0 = y | 0, i1 = i0 + 1, j1 = j0 + 1;
        const s1 = x - i0, s0 = 1 - s1, t1 = y - j0, t0 = 1 - t1;
        d[IX(i, j)] = s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) + s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
      }
    setBnd(b, d);
  }

  function project(uu: Float32Array, vv: Float32Array, p: Float32Array, div: Float32Array) {
    const h = 1 / N;
    for (let j = 1; j <= N; j++)
      for (let i = 1; i <= N; i++) {
        div[IX(i, j)] = -0.5 * h * (uu[IX(i + 1, j)] - uu[IX(i - 1, j)] + vv[IX(i, j + 1)] - vv[IX(i, j - 1)]);
        p[IX(i, j)] = 0;
      }
    setBnd(0, div);
    setBnd(0, p);
    linSolve(0, p, div, 1, 4, 20);
    for (let j = 1; j <= N; j++)
      for (let i = 1; i <= N; i++) {
        uu[IX(i, j)] -= (0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)])) / h;
        vv[IX(i, j)] -= (0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)])) / h;
      }
    setBnd(1, uu);
    setBnd(2, vv);
  }

  function step(dt: number) {
    // velocity
    [u0, u] = [u, u0];
    [v0, v] = [v, v0];
    diffuse(1, u, u0, params.viscosity, dt);
    diffuse(2, v, v0, params.viscosity, dt);
    project(u, v, u0, v0);
    [u0, u] = [u, u0];
    [v0, v] = [v, v0];
    advect(1, u, u0, u0, v0, dt);
    advect(2, v, v0, u0, v0, dt);
    project(u, v, u0, v0);
    // dye (advect only; dissipation fades it)
    for (let c = 0; c < 3; c++) {
      dye0[c].set(dye[c]);
      advect(0, dye[c], dye0[c], u, v, dt);
      const d = dye[c];
      for (let k = 0; k < S; k++) d[k] *= params.dissipation;
    }
  }

  /** x, y in 0..1; dx, dy velocity in grid units; rgb 0..1 */
  function splat(x: number, y: number, dx: number, dy: number, rgb: [number, number, number]) {
    const cx = Math.round(x * N) + 1, cy = Math.round(y * N) + 1;
    const r = Math.max(1, params.radius);
    for (let j = -r * 2; j <= r * 2; j++)
      for (let i = -r * 2; i <= r * 2; i++) {
        const X = cx + i, Y = cy + j;
        if (X < 1 || Y < 1 || X > N || Y > N) continue;
        const w = Math.exp(-(i * i + j * j) / (r * r));
        u[IX(X, Y)] += dx * params.force * w;
        v[IX(X, Y)] += dy * params.force * w;
        for (let c = 0; c < 3; c++) dye[c][IX(X, Y)] = Math.min(4, dye[c][IX(X, Y)] + rgb[c] * w * 1.5);
      }
  }

  /** Writes dye into an RGBA buffer of size N×N. */
  function paint(out: Uint8ClampedArray) {
    let o = 0;
    for (let j = 1; j <= N; j++)
      for (let i = 1; i <= N; i++) {
        const k = IX(i, j);
        // soft tonemap so saturated dye doesn't clip harshly
        out[o++] = 255 * (1 - Math.exp(-dye[0][k])) + 7;
        out[o++] = 255 * (1 - Math.exp(-dye[1][k])) + 7;
        out[o++] = 255 * (1 - Math.exp(-dye[2][k])) + 11;
        out[o++] = 255;
      }
  }

  return { N, params, step, splat, paint };
}

export function hueToRgb(h: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return 0.5 - 0.5 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}
