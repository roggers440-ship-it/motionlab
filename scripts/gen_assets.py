#!/usr/bin/env python3
"""
MotionLab asset generator — everything in /public is procedurally generated,
so the repo ships with zero third-party media and zero licensing questions.

  python3 scripts/gen_assets.py          # needs: numpy, pillow, ffmpeg on PATH

Outputs
  public/images/art-{1..5}.jpg           abstract artworks (shader demos, grids)
  public/sequence/frame_XXX.webp         96-frame raymarched "product" turntable
  public/video/orbit-scrub.mp4           same frames, ALL-KEYFRAME (-g 1) for scroll scrubbing
  public/video/orbit-loop.mp4            normal GOP, small, for live video masking
  public/video/*.webm                    VP9 twins of both (browsers without H.264)
"""
import os, subprocess, math
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "public")
rng = np.random.default_rng(7)


def ensure(p):
    os.makedirs(p, exist_ok=True)
    return p


# --------------------------------------------------------------------------- #
# 1. Abstract artworks — domain-warped value noise mapped through palettes
# --------------------------------------------------------------------------- #
def value_noise(w, h, scale, seed):
    r = np.random.default_rng(seed)
    gw, gh = int(w / scale) + 3, int(h / scale) + 3
    grid = r.random((gh, gw))
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    x, y = xs / scale, ys / scale
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    fx, fy = x - x0, y - y0
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a, b = grid[y0, x0], grid[y0, x0 + 1]
    c, d = grid[y0 + 1, x0], grid[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def fbm(w, h, base, seed, octaves=5):
    out, amp, tot = np.zeros((h, w), np.float32), 1.0, 0.0
    for o in range(octaves):
        out += amp * value_noise(w, h, base / (2 ** o), seed + o)
        tot += amp
        amp *= 0.5
    return out / tot


PALETTES = [
    [(8, 6, 30), (70, 40, 200), (255, 90, 160), (255, 210, 120)],
    [(2, 20, 25), (0, 120, 130), (120, 240, 200), (250, 250, 230)],
    [(20, 5, 5), (160, 30, 40), (255, 140, 50), (255, 240, 200)],
    [(5, 5, 15), (40, 70, 160), (150, 120, 255), (240, 230, 255)],
    [(10, 15, 5), (60, 110, 40), (220, 210, 80), (255, 250, 220)],
]


def palette_map(t, pal):
    t = np.clip(t, 0, 1) * (len(pal) - 1)
    i = np.clip(np.floor(t).astype(int), 0, len(pal) - 2)
    f = (t - i)[..., None]
    p = np.array(pal, np.float32)
    return p[i] * (1 - f) + p[i + 1] * f


def artworks():
    out = ensure(os.path.join(ROOT, "images"))
    W, H = 1600, 1000
    for k, pal in enumerate(PALETTES, 1):
        q1 = fbm(W, H, 420, k * 10)
        q2 = fbm(W, H, 420, k * 10 + 5)
        ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
        # domain warp: sample fbm at a coordinate offset by another fbm
        warp = np.sin((xs / W * 3 + q1 * 4.0) * math.pi) * 0.5 + np.cos((ys / H * 2 + q2 * 4.0) * math.pi) * 0.5
        t = (warp * 0.5 + 0.5) * 0.75 + fbm(W, H, 140, k * 99, 4) * 0.35
        img = palette_map(t, pal)
        # subtle grain + vignette
        img += rng.normal(0, 4, img.shape)
        vx, vy = (xs / W - 0.5), (ys / H - 0.5)
        img *= (1 - (vx ** 2 + vy ** 2) * 0.9)[..., None]
        Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(
            os.path.join(out, f"art-{k}.jpg"), quality=84, optimize=True, progressive=True)
        print("art", k)


# --------------------------------------------------------------------------- #
# 2. Raymarched turntable (torus + orbiting spheres) — the "product shot"
# --------------------------------------------------------------------------- #
def rot_y(p, a):
    c, s = math.cos(a), math.sin(a)
    x, y, z = p[..., 0], p[..., 1], p[..., 2]
    return np.stack([c * x + s * z, y, -s * x + c * z], -1)


def rot_x(p, a):
    c, s = math.cos(a), math.sin(a)
    x, y, z = p[..., 0], p[..., 1], p[..., 2]
    return np.stack([x, c * y - s * z, s * y + c * z], -1)


def scene_sdf(p, t):
    q = rot_x(rot_y(p, t), 0.6 + 0.25 * math.sin(t))
    xz = np.sqrt(q[..., 0] ** 2 + q[..., 2] ** 2) - 1.0
    torus = np.sqrt(xz ** 2 + q[..., 1] ** 2) - 0.34
    d = torus
    for i in range(3):
        a = t * 1.5 + i * 2.094
        c = np.array([math.cos(a) * 1.75, math.sin(a * 2) * 0.35, math.sin(a) * 1.75], np.float32)
        d = np.minimum(d, np.linalg.norm(p - c, axis=-1) - 0.2)
    core = np.linalg.norm(p, axis=-1) - 0.45
    return np.minimum(d, core)


def render_frame(t, W=960, H=540):
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    uv = np.stack([(xs - W / 2) / H, -(ys - H / 2) / H], -1)
    ro = np.array([0, 0, 4.6], np.float32)
    rd = np.concatenate([uv, -np.full(uv.shape[:-1] + (1,), 1.4, np.float32)], -1)
    rd /= np.linalg.norm(rd, axis=-1, keepdims=True)
    dist = np.zeros((H, W), np.float32)
    hit = np.zeros((H, W), bool)
    for _ in range(70):
        p = ro + rd * dist[..., None]
        d = scene_sdf(p, t)
        hit |= d < 0.002
        dist += np.where(hit, 0, d * 0.9)
        if dist.min() > 12:
            break
    p = ro + rd * dist[..., None]
    e = 0.003
    n = np.stack([
        scene_sdf(p + [e, 0, 0], t) - scene_sdf(p - [e, 0, 0], t),
        scene_sdf(p + [0, e, 0], t) - scene_sdf(p - [0, e, 0], t),
        scene_sdf(p + [0, 0, e], t) - scene_sdf(p - [0, 0, e], t)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True) + 1e-9
    l1 = np.array([0.6, 0.7, 0.5]); l1 /= np.linalg.norm(l1)
    l2 = np.array([-0.7, -0.2, 0.4]); l2 /= np.linalg.norm(l2)
    dif1 = np.clip((n * l1).sum(-1), 0, 1)[..., None]
    dif2 = np.clip((n * l2).sum(-1), 0, 1)[..., None]
    fres = (1 - np.clip(-(n * rd).sum(-1), 0, 1)) ** 3
    col = dif1 * np.array([1.0, 0.55, 0.8]) + dif2 * np.array([0.3, 0.5, 1.0]) + fres[..., None] * np.array([0.9, 0.9, 1.0])
    col = col * 0.9 + 0.05
    # background: soft radial gradient
    r = np.sqrt(uv[..., 0] ** 2 + uv[..., 1] ** 2)[..., None]
    bg = np.array([0.05, 0.04, 0.12]) * (1 - r * 0.6) + np.array([0.12, 0.05, 0.2]) * np.exp(-r * 3)
    img = np.where(hit[..., None], col, bg)
    img = img / (1 + img)  # tonemap
    img = np.power(img * 1.6, 1 / 2.2)
    return Image.fromarray(np.clip(img * 255, 0, 255).astype(np.uint8))


def sequence(frames=96):
    out = ensure(os.path.join(ROOT, "sequence"))
    for i in range(frames):
        t = i / frames * math.tau
        render_frame(t).save(os.path.join(out, f"frame_{i:03d}.webp"), quality=72, method=4)
        if i % 12 == 0:
            print("frame", i)
    vid = ensure(os.path.join(ROOT, "video"))
    pattern = os.path.join(out, "frame_%03d.webp")
    # -g 1: every frame is a keyframe → seeking to any currentTime is instant (scroll scrubbing)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "24", "-i", pattern,
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "1", "-crf", "26",
                    "-movflags", "+faststart", "-an", os.path.join(vid, "orbit-scrub.mp4")], check=True)
    # normal GOP for playback (much smaller) — used under the SVG mask demo
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-stream_loop", "1", "-framerate", "24", "-i", pattern,
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "28",
                    "-movflags", "+faststart", "-an", os.path.join(vid, "orbit-loop.mp4")], check=True)
    # VP9/WebM twins: Chromium builds without H.264 (and some Linux Firefox) need these
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "24", "-i", pattern,
                    "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-g", "1", "-crf", "36", "-b:v", "0", "-row-mt", "1",
                    "-an", os.path.join(vid, "orbit-scrub.webm")], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-stream_loop", "1", "-framerate", "24", "-i", pattern,
                    "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-crf", "40", "-b:v", "0", "-row-mt", "1",
                    "-an", os.path.join(vid, "orbit-loop.webm")], check=True)
    print("videos done")


if __name__ == "__main__":
    artworks()
    sequence()
