/**
 * HD illustrated map renderer (BasePrompt §M12 visual overhaul — smooth, PS2-era look).
 *
 * Everything is drawn with anti-aliasing on, using gradients, soft drop shadows and a gentle
 * vignette instead of chunky pixels. Decoration (trees / ponds) is placed deterministically from a
 * hash so the scenery is stable across frames. Kept intentionally cache-free: the element count is
 * tiny, so we simply repaint the whole illustrated scene each animation frame.
 *
 * Public API kept stable for MapView + the rest of the app: makeCamera, worldToScreen,
 * trainWorldPos, pickTown, drawMap, viewTransform, MapEffect, Camera, Vec2.
 */
import type { GameState, Town, Train, CargoKind } from '../game/model/types'
import { clamp } from '../game/util'

export interface Camera {
  scale: number
  ox: number
  oy: number
}

export interface Vec2 {
  x: number
  y: number
}

/** A transient bit of "juice" surfaced by the store (delivery payout / town unlock). */
export interface MapEffect {
  id: string
  kind: 'coin' | 'unlock'
  town: string
  atMs: number
  amount?: number
}

/** Per-train-kind body palette (light highlight → mid → dark shade) for soft shaded locos. */
const TRAIN_PALETTE: Record<Train['kind'], { hi: string; mid: string; dark: string }> = {
  steam: { hi: '#e7a85a', mid: '#bf6f24', dark: '#7c4413' },
  diesel: { hi: '#6fc0d0', mid: '#2f6f7e', dark: '#194851' },
  electric: { hi: '#b79be0', mid: '#6a4c93', dark: '#3f2c5c' },
}

/** Crate colour per cargo kind, used to tint cargo cars. */
const CARGO_COLOR: Record<CargoKind, string> = {
  passengers: '#e8c45e',
  mail: '#d56a8c',
  produce: '#7fc24a',
  livestock: '#d9a066',
  timber: '#9c6b3a',
  machinery: '#9aa0ac',
}

// ── Camera / coordinate helpers ─────────────────────────────────────────────

/** Fit all towns into the given pixel box with padding, preserving aspect ratio. */
export function makeCamera(state: GameState, w: number, h: number, pad = 48): Camera {
  return fitCamera(state, w, h, { t: pad, b: pad, l: pad, r: pad })
}

interface Insets {
  t: number
  b: number
  l: number
  r: number
}

/** Fit all towns inside the box shrunk by per-side insets (room for the HUD + bottom menu). */
function fitCamera(state: GameState, w: number, h: number, ins: Insets): Camera {
  const xs = state.towns.map((t) => t.x)
  const ys = state.towns.map((t) => t.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const wW = maxX - minX || 1
  const wH = maxY - minY || 1
  const availW = Math.max(1, w - ins.l - ins.r)
  const availH = Math.max(1, h - ins.t - ins.b)
  const scale = Math.min(availW / wW, availH / wH)
  const ox = ins.l + (availW - wW * scale) / 2 - minX * scale
  const oy = ins.t + (availH - wH * scale) / 2 - minY * scale
  return { scale, ox, oy }
}

export function worldToScreen(cam: Camera, x: number, y: number): Vec2 {
  return { x: x * cam.scale + cam.ox, y: y * cam.scale + cam.oy }
}

interface ViewTransform {
  scale: number
  artW: number
  artH: number
  /** Camera mapping world → screen space (renderer + input share this in the HD pipeline). */
  artCam: Camera
  /** Alias of artCam kept for the MapView hit-test call site. */
  cssCam: Camera
}

/** Single source of truth for world→screen mapping. HD draws 1:1 in CSS pixels (no upscale). */
export function viewTransform(state: GameState, w: number, h: number): ViewTransform {
  const side = clamp(Math.round(w * 0.13), 28, 70)
  const cam = fitCamera(state, w, h, { t: 72, b: 116, l: side, r: side })
  return { scale: 1, artW: w, artH: h, artCam: cam, cssCam: cam }
}

function findTown(state: GameState, id: string): Town | undefined {
  return state.towns.find((t) => t.id === id)
}

/** World-space position of a train right now (interpolated when en route). */
export function trainWorldPos(state: GameState, train: Train, now: number): Vec2 | null {
  if (train.location.type === 'at-town') {
    const t = findTown(state, train.location.town)
    return t ? { x: t.x, y: t.y } : null
  }
  const from = findTown(state, train.location.from)
  const to = findTown(state, train.location.to)
  if (!from || !to) return null
  const { departAtMs, arriveAtMs } = train.location
  const span = arriveAtMs - departAtMs || 1
  const p = clamp((now - departAtMs) / span, 0, 1)
  return { x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p }
}

/** Nearest town to a screen point within `radiusPx`, or undefined. */
export function pickTown(
  state: GameState,
  cam: Camera,
  sx: number,
  sy: number,
  radiusPx = 34,
): Town | undefined {
  let best: Town | undefined
  let bestD = radiusPx * radiusPx
  for (const t of state.towns) {
    const s = worldToScreen(cam, t.x, t.y)
    const d = (s.x - sx) ** 2 + (s.y - sy) ** 2
    if (d <= bestD) {
      bestD = d
      best = t
    }
  }
  return best
}

// ── Small drawing helpers ───────────────────────────────────────────────────

function hash2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695040) | 0
  h = (h ^ (h >> 13)) * 1274126177
  h = h ^ (h >> 16)
  return ((h >>> 0) % 100000) / 100000
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Soft elliptical ground shadow. */
function shadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number): void {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx)
  g.addColorStop(0, 'rgba(30,40,30,0.30)')
  g.addColorStop(1, 'rgba(30,40,30,0)')
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(1, ry / rx)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, rx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ── Background: grass, hills, ponds, trees ──────────────────────────────────

function distToTrack(state: GameState, cam: Camera, ax: number, ay: number): number {
  let min = Infinity
  for (const seg of state.track) {
    const a = findTown(state, seg.a)
    const b = findTown(state, seg.b)
    if (!a || !b) continue
    const pa = worldToScreen(cam, a.x, a.y)
    const pb = worldToScreen(cam, b.x, b.y)
    const dx = pb.x - pa.x
    const dy = pb.y - pa.y
    const len2 = dx * dx + dy * dy || 1
    const t = clamp(((ax - pa.x) * dx + (ay - pa.y) * dy) / len2, 0, 1)
    const d = Math.hypot(ax - (pa.x + dx * t), ay - (pa.y + dy * t))
    if (d < min) min = d
  }
  return min
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cam: Camera,
  w: number,
  h: number,
  su: number,
): void {
  // Meadow gradient base.
  const base = ctx.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, '#a8d88f')
  base.addColorStop(0.55, '#8ecb7c')
  base.addColorStop(1, '#79bb6c')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // Soft rolling hills — a few deterministic translucent blobs for depth.
  for (let i = 0; i < 7; i++) {
    const hx = hash2(i, 1, 5) * w
    const hy = hash2(i, 2, 6) * h
    const r = (40 + hash2(i, 3, 7) * 90) * su
    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r)
    const light = hash2(i, 4, 8) > 0.5
    g.addColorStop(0, light ? 'rgba(186,224,150,0.45)' : 'rgba(104,176,92,0.40)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(hx, hy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Ponds (kept clear of the rail network).
  const ponds = [
    { x: w * 0.2, y: h * 0.74, r: 46 * su },
    { x: w * 0.82, y: h * 0.26, r: 36 * su },
  ]
  for (const p of ponds) {
    if (distToTrack(state, cam, p.x, p.y) < p.r + 18) continue
    drawPond(ctx, p.x, p.y, p.r)
  }

  // Trees scattered on a jittered grid, away from towns / track / ponds.
  const step = 58 * su
  for (let gy = step * 0.6; gy < h - step * 0.4; gy += step) {
    for (let gx = step * 0.6; gx < w - step * 0.4; gx += step) {
      const r = hash2(gx, gy, 13)
      if (r < 0.5) continue
      const jx = gx + (hash2(gx, gy, 21) - 0.5) * step * 0.8
      const jy = gy + (hash2(gx, gy, 22) - 0.5) * step * 0.8
      let near = false
      for (const t of state.towns) {
        const s = worldToScreen(cam, t.x, t.y)
        if (Math.hypot(s.x - jx, s.y - jy) < 46 * su) near = true
      }
      if (near) continue
      if (distToTrack(state, cam, jx, jy) < 22 * su) continue
      let inPond = false
      for (const p of ponds) if (Math.hypot(p.x - jx, p.y - jy) < p.r + 16 * su) inPond = true
      if (inPond) continue
      if (r > 0.86) drawBush(ctx, jx, jy, su)
      else drawTree(ctx, jx, jy, su, hash2(gx, gy, 31))
    }
  }

  // Gentle edge vignette to focus the eye on the network.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(20,40,25,0.22)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

function drawPond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(1, 0.66)
  const g = ctx.createRadialGradient(0, -r * 0.2, r * 0.1, 0, 0, r)
  g.addColorStop(0, '#7fd0ea')
  g.addColorStop(0.7, '#4fa8d8')
  g.addColorStop(1, '#3f86bd')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  // shoreline
  ctx.strokeStyle = 'rgba(120,90,60,0.35)'
  ctx.lineWidth = 3
  ctx.stroke()
  // glint
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.beginPath()
  ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.28, r * 0.1, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawTree(ctx: CanvasRenderingContext2D, cx: number, cy: number, su: number, v: number): void {
  const s = (0.85 + v * 0.5) * su
  shadow(ctx, cx, cy + 9 * s, 12 * s, 5 * s)
  // trunk
  ctx.fillStyle = '#7a4f2c'
  roundRect(ctx, cx - 2.2 * s, cy, 4.4 * s, 11 * s, 1.5 * s)
  ctx.fill()
  // layered canopy
  const canopy = (oy: number, rad: number, col: string): void => {
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(cx, cy + oy, rad, 0, Math.PI * 2)
    ctx.fill()
  }
  canopy(-2 * s, 12 * s, '#3f8a47')
  canopy(-9 * s, 10 * s, '#4f9e54')
  canopy(-15 * s, 7.5 * s, '#5fae5a')
  // highlight
  ctx.fillStyle = 'rgba(200,235,170,0.55)'
  ctx.beginPath()
  ctx.arc(cx - 4 * s, cy - 14 * s, 3 * s, 0, Math.PI * 2)
  ctx.fill()
}

function drawBush(ctx: CanvasRenderingContext2D, cx: number, cy: number, su: number): void {
  shadow(ctx, cx, cy + 5 * su, 9 * su, 4 * su)
  ctx.fillStyle = '#4f9e54'
  ctx.beginPath()
  ctx.arc(cx - 4 * su, cy, 6 * su, 0, Math.PI * 2)
  ctx.arc(cx + 4 * su, cy, 6 * su, 0, Math.PI * 2)
  ctx.arc(cx, cy - 3 * su, 7 * su, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(200,235,170,0.5)'
  ctx.beginPath()
  ctx.arc(cx - 2 * su, cy - 5 * su, 2.4 * su, 0, Math.PI * 2)
  ctx.fill()
}

// ── Track ───────────────────────────────────────────────────────────────────

function drawTrack(ctx: CanvasRenderingContext2D, state: GameState, cam: Camera, su: number): void {
  const segs = state.track
    .map((seg) => ({ a: findTown(state, seg.a), b: findTown(state, seg.b) }))
    .filter((s): s is { a: Town; b: Town } => !!s.a && !!s.b)
    .map(({ a, b }) => ({ pa: worldToScreen(cam, a.x, a.y), pb: worldToScreen(cam, b.x, b.y) }))

  // 1) soft roadbed.
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#b69a72'
  ctx.lineWidth = 11 * su
  for (const { pa, pb } of segs) {
    ctx.beginPath()
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
    ctx.stroke()
  }
  ctx.strokeStyle = '#9c8059'
  ctx.lineWidth = 8 * su
  for (const { pa, pb } of segs) {
    ctx.beginPath()
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
    ctx.stroke()
  }

  // 2) sleepers.
  for (const { pa, pb } of segs) {
    const dx = pb.x - pa.x
    const dy = pb.y - pa.y
    const len = Math.max(1, Math.hypot(dx, dy))
    const ux = dx / len
    const uy = dy / len
    const nx = -uy
    const ny = ux
    const gap = 12 * su
    ctx.strokeStyle = '#6e4a2a'
    ctx.lineWidth = 2.2 * su
    for (let d = gap / 2; d < len; d += gap) {
      const cx = pa.x + ux * d
      const cy = pa.y + uy * d
      ctx.beginPath()
      ctx.moveTo(cx + nx * 5 * su, cy + ny * 5 * su)
      ctx.lineTo(cx - nx * 5 * su, cy - ny * 5 * su)
      ctx.stroke()
    }
  }

  // 3) two steel rails.
  for (const { pa, pb } of segs) {
    const dx = pb.x - pa.x
    const dy = pb.y - pa.y
    const len = Math.max(1, Math.hypot(dx, dy))
    const nx = -(dy / len)
    const ny = dx / len
    ctx.strokeStyle = '#cfd4dc'
    ctx.lineWidth = 1.6 * su
    for (const o of [-3.2 * su, 3.2 * su]) {
      ctx.beginPath()
      ctx.moveTo(pa.x + nx * o, pa.y + ny * o)
      ctx.lineTo(pb.x + nx * o, pb.y + ny * o)
      ctx.stroke()
    }
  }
}

// ── Stations ────────────────────────────────────────────────────────────────

function drawStation(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  unlocked: boolean,
  su: number,
): void {
  const bw = 38 * su
  const bh = 26 * su
  const roofH = 15 * su
  const over = 5 * su
  const bottom = cy + 7 * su
  const top = bottom - bh

  shadow(ctx, cx, bottom + 2 * su, bw * 0.75, 7 * su)

  // body
  const wallG = ctx.createLinearGradient(0, top, 0, bottom)
  if (unlocked) {
    wallG.addColorStop(0, '#fbf0d4')
    wallG.addColorStop(1, '#e7d3a8')
  } else {
    wallG.addColorStop(0, '#d8d8de')
    wallG.addColorStop(1, '#b9b9c2')
  }
  ctx.fillStyle = wallG
  roundRect(ctx, cx - bw / 2, top, bw, bh, 4 * su)
  ctx.fill()

  // roof (gable)
  const roofG = ctx.createLinearGradient(0, top - roofH, 0, top)
  if (unlocked) {
    roofG.addColorStop(0, '#e8745a')
    roofG.addColorStop(1, '#c0503e')
  } else {
    roofG.addColorStop(0, '#a9a9b2')
    roofG.addColorStop(1, '#8a8a94')
  }
  ctx.fillStyle = roofG
  ctx.beginPath()
  ctx.moveTo(cx - bw / 2 - over, top + 1)
  ctx.lineTo(cx + bw / 2 + over, top + 1)
  ctx.lineTo(cx + bw / 2 - 2 * su, top - roofH)
  ctx.lineTo(cx - bw / 2 + 2 * su, top - roofH)
  ctx.closePath()
  ctx.fill()
  // roof ridge highlight
  ctx.fillStyle = unlocked ? 'rgba(255,210,180,0.6)' : 'rgba(220,220,228,0.5)'
  ctx.fillRect(cx - bw / 2 + 2 * su, top - roofH, bw - 4 * su, 1.6 * su)

  // door
  ctx.fillStyle = unlocked ? '#8a5a2b' : '#7c7c84'
  roundRect(ctx, cx - 4 * su, bottom - 12 * su, 8 * su, 12 * su, 2 * su)
  ctx.fill()

  // windows with glass + glow
  const winY = top + 6 * su
  for (const wx of [cx - 12 * su, cx + 12 * su]) {
    const gg = ctx.createLinearGradient(0, winY, 0, winY + 7 * su)
    gg.addColorStop(0, unlocked ? '#cdecff' : '#cfd2d8')
    gg.addColorStop(1, unlocked ? '#9fcef0' : '#aeb1b8')
    ctx.fillStyle = gg
    roundRect(ctx, wx - 4 * su, winY, 8 * su, 7 * su, 1.5 * su)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillRect(wx - 3 * su, winY + 1 * su, 2.4 * su, 2.4 * su)
  }

  if (!unlocked) drawLockBadge(ctx, cx, top - roofH * 0.2, su)
}

function drawLockBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, su: number): void {
  const r = 9 * su
  shadow(ctx, cx, cy + r * 0.8, r, r * 0.5)
  ctx.fillStyle = '#3a3550'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  // shackle
  ctx.strokeStyle = '#cfcad6'
  ctx.lineWidth = 2 * su
  ctx.beginPath()
  ctx.arc(cx, cy - 2 * su, 3.4 * su, Math.PI, 0)
  ctx.stroke()
  // body + keyhole
  ctx.fillStyle = '#cfcad6'
  roundRect(ctx, cx - 4.5 * su, cy - 1 * su, 9 * su, 7.5 * su, 1.5 * su)
  ctx.fill()
  ctx.fillStyle = '#3a3550'
  ctx.beginPath()
  ctx.arc(cx, cy + 2 * su, 1.4 * su, 0, Math.PI * 2)
  ctx.fill()
}

// ── Trains ──────────────────────────────────────────────────────────────────

function drawTrains(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cam: Camera,
  now: number,
  su: number,
): void {
  for (const train of state.trains) {
    const wp = trainWorldPos(state, train, now)
    if (!wp) continue
    const s = worldToScreen(cam, wp.x, wp.y)

    let dirx = 1
    let diry = 0
    let moving = false
    if (train.location.type === 'en-route') {
      const from = findTown(state, train.location.from)
      const to = findTown(state, train.location.to)
      if (from && to) {
        dirx = to.x - from.x
        diry = to.y - from.y
        const dl = Math.hypot(dirx, diry) || 1
        dirx /= dl
        diry /= dl
        moving = true
      }
    }
    const flip = dirx < 0
    const bob = moving ? Math.sin(now / 130 + s.x) * 1.2 * su : 0

    // trailing cargo cars (behind, opposite travel; default left at rest)
    const tdx = moving ? -dirx : -1
    const tdy = moving ? -diry : 0
    for (let i = train.cars.length - 1; i >= 0 && i < 4; i--) {
      const car = train.cars[i]
      if (!car) continue
      const off = (24 + i * 18) * su
      drawCargoCar(ctx, s.x + tdx * off, s.y + tdy * off + bob, CARGO_COLOR[car.kind], su)
    }

    drawLoco(ctx, s.x, s.y + bob, train.kind, flip, su)

    if (moving) {
      const front = flip ? -1 : 1
      const chimX = s.x + front * 12 * su
      const chimY = s.y - 12 * su + bob
      for (let k = 0; k < 4; k++) {
        const p = (now / 260 + k / 4) % 1
        const px = chimX - front * dirx * p * 10 * su
        const py = chimY - p * 22 * su
        const rad = (2.5 + p * 6) * su
        ctx.globalAlpha = 0.5 * (1 - p)
        const g = ctx.createRadialGradient(px, py, 0, px, py, rad)
        g.addColorStop(0, 'rgba(245,245,250,1)')
        g.addColorStop(1, 'rgba(210,212,224,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(px, py, rad, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
  }
}

function drawLoco(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  kind: Train['kind'],
  flip: boolean,
  su: number,
): void {
  const pal = TRAIN_PALETTE[kind]
  shadow(ctx, cx, cy + 11 * su, 22 * su, 6 * su)
  ctx.save()
  ctx.translate(cx, cy)
  if (flip) ctx.scale(-1, 1)

  // wheels
  ctx.fillStyle = '#2b2b3a'
  for (const wxp of [-9 * su, 0, 9 * su]) {
    ctx.beginPath()
    ctx.arc(wxp, 9 * su, 3.4 * su, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#6a6a78'
  for (const wxp of [-9 * su, 0, 9 * su]) {
    ctx.beginPath()
    ctx.arc(wxp, 9 * su, 1.3 * su, 0, Math.PI * 2)
    ctx.fill()
  }

  // main body
  const bodyG = ctx.createLinearGradient(0, -8 * su, 0, 9 * su)
  bodyG.addColorStop(0, pal.hi)
  bodyG.addColorStop(0.5, pal.mid)
  bodyG.addColorStop(1, pal.dark)
  ctx.fillStyle = bodyG
  roundRect(ctx, -16 * su, -3 * su, 26 * su, 12 * su, 3 * su)
  ctx.fill()

  // boiler front cap
  ctx.fillStyle = pal.dark
  roundRect(ctx, 8 * su, -4 * su, 5 * su, 13 * su, 2 * su)
  ctx.fill()
  ctx.fillStyle = '#ffd35e'
  ctx.beginPath()
  ctx.arc(10.5 * su, 2 * su, 1.8 * su, 0, Math.PI * 2)
  ctx.fill()

  // cab (rear)
  const cabG = ctx.createLinearGradient(0, -10 * su, 0, 4 * su)
  cabG.addColorStop(0, pal.mid)
  cabG.addColorStop(1, pal.dark)
  ctx.fillStyle = cabG
  roundRect(ctx, -16 * su, -10 * su, 11 * su, 13 * su, 3 * su)
  ctx.fill()
  // cab window
  const winG = ctx.createLinearGradient(0, -8 * su, 0, -2 * su)
  winG.addColorStop(0, '#cdecff')
  winG.addColorStop(1, '#8fc4e8')
  ctx.fillStyle = winG
  roundRect(ctx, -13.5 * su, -7.5 * su, 6 * su, 5.5 * su, 1.5 * su)
  ctx.fill()

  // chimney
  ctx.fillStyle = '#2b2b3a'
  roundRect(ctx, 4 * su, -10 * su, 4 * su, 6 * su, 1 * su)
  ctx.fill()
  ctx.fillStyle = '#3c3c4e'
  roundRect(ctx, 3 * su, -11 * su, 6 * su, 2.4 * su, 1 * su)
  ctx.fill()

  // body top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  roundRect(ctx, -14 * su, -2 * su, 22 * su, 2.4 * su, 1.2 * su)
  ctx.fill()

  ctx.restore()
}

function drawCargoCar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
  su: number,
): void {
  shadow(ctx, cx, cy + 10 * su, 12 * su, 4 * su)
  // wheels
  ctx.fillStyle = '#2b2b3a'
  for (const wxp of [-5 * su, 5 * su]) {
    ctx.beginPath()
    ctx.arc(cx + wxp, cy + 9 * su, 3 * su, 0, Math.PI * 2)
    ctx.fill()
  }
  // crate body
  const g = ctx.createLinearGradient(0, cy - 7 * su, 0, cy + 7 * su)
  g.addColorStop(0, lighten(color, 0.25))
  g.addColorStop(1, color)
  ctx.fillStyle = g
  roundRect(ctx, cx - 9 * su, cy - 7 * su, 18 * su, 14 * su, 3 * su)
  ctx.fill()
  // frame + highlight
  ctx.strokeStyle = 'rgba(40,30,20,0.35)'
  ctx.lineWidth = 1.4 * su
  roundRect(ctx, cx - 9 * su, cy - 7 * su, 18 * su, 14 * su, 3 * su)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  roundRect(ctx, cx - 7 * su, cy - 5.5 * su, 14 * su, 2.4 * su, 1.2 * su)
  ctx.fill()
}

/** Lighten a #rrggbb colour toward white by amount 0..1. */
function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const mix = (c: number): number => Math.round(c + (255 - c) * amt)
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`
}

// ── Labels, bubbles, effects ────────────────────────────────────────────────

function drawLabels(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cam: Camera,
  now: number,
  effects: MapEffect[],
  su: number,
): void {
  const font = `700 ${Math.round(13 * su)}px ${UI_FONT}`
  ctx.textAlign = 'center'

  for (const t of state.towns) {
    const s = worldToScreen(cam, t.x, t.y)
    const ly = s.y + 18 * su

    // name pill
    ctx.font = font
    ctx.textBaseline = 'middle'
    const label = t.name
    const tw = ctx.measureText(label).width
    const padX = 7 * su
    const pillH = 19 * su
    ctx.fillStyle = 'rgba(34,28,46,0.62)'
    roundRect(ctx, s.x - tw / 2 - padX, ly, tw + padX * 2, pillH, pillH / 2)
    ctx.fill()
    ctx.fillStyle = t.unlocked ? '#fff8e8' : '#d6d1dd'
    ctx.fillText(label, s.x, ly + pillH / 2 + 0.5)

    // job-count bubble
    if (t.unlocked && t.jobs.length > 0) {
      const bx = s.x + 17 * su
      const by = s.y - 22 * su
      shadow(ctx, bx, by + 3 * su, 9 * su, 4 * su)
      const bg = ctx.createLinearGradient(0, by - 9 * su, 0, by + 9 * su)
      bg.addColorStop(0, '#e8745a')
      bg.addColorStop(1, '#c0503e')
      ctx.fillStyle = bg
      ctx.beginPath()
      ctx.arc(bx, by, 9 * su, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `800 ${Math.round(11 * su)}px ${UI_FONT}`
      ctx.fillText(String(t.jobs.length), bx, by + 0.5)
    }
  }

  // selection ring
  // (drawn here so it sits above ground but with soft glow)

  // coin pops
  for (const fx of effects) {
    if (fx.kind !== 'coin') continue
    const t = findTown(state, fx.town)
    if (!t) continue
    const age = (now - fx.atMs) / 1300
    if (age < 0 || age > 1) continue
    const s = worldToScreen(cam, t.x, t.y)
    const y = s.y - 26 * su - age * 30 * su
    ctx.globalAlpha = 1 - age
    ctx.font = `800 ${Math.round(15 * su)}px ${UI_FONT}`
    ctx.lineWidth = 3 * su
    ctx.strokeStyle = 'rgba(34,28,46,0.85)'
    ctx.fillStyle = '#ffd35e'
    const txt = `+${fx.amount ?? ''}`
    ctx.strokeText(txt, s.x, y)
    ctx.fillText(txt, s.x, y)
    ctx.globalAlpha = 1
  }
}

const UI_FONT = `ui-rounded, 'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif`

function drawSelection(ctx: CanvasRenderingContext2D, s: Vec2, now: number, su: number): void {
  const pulse = 1 + Math.sin(now / 240) * 0.12
  const r = 30 * su * pulse
  ctx.save()
  ctx.translate(s.x, s.y + 2 * su)
  ctx.scale(1, 0.62)
  const g = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r)
  g.addColorStop(0, 'rgba(255,215,94,0)')
  g.addColorStop(0.7, 'rgba(255,215,94,0.35)')
  g.addColorStop(1, 'rgba(255,215,94,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,225,120,0.9)'
  ctx.lineWidth = 2 * su
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawUnlockSparkle(ctx: CanvasRenderingContext2D, s: Vec2, age: number, su: number): void {
  const rad = (8 + age * 26) * su
  ctx.globalAlpha = 1 - age
  ctx.strokeStyle = age < 0.5 ? '#ffd35e' : '#fff6cf'
  ctx.lineWidth = 2 * su
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    const x = s.x + Math.cos(a) * rad
    const y = s.y - 4 * su + Math.sin(a) * rad
    ctx.beginPath()
    ctx.arc(x, y, 2 * su, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

// ── Public draw ─────────────────────────────────────────────────────────────

/** Paint the whole illustrated scene. `selectedId` highlights one town; `effects` adds juice. */
export function drawMap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  w: number,
  h: number,
  selectedId: string | null,
  effects: MapEffect[] = [],
): void {
  const { artCam: cam } = viewTransform(state, w, h)
  const su = clamp(Math.min(w, h) / 430, 0.8, 1.5)

  ctx.imageSmoothingEnabled = true
  ctx.clearRect(0, 0, w, h)

  drawBackground(ctx, state, cam, w, h, su)
  drawTrack(ctx, state, cam, su)

  // Selection glow under the selected station.
  if (selectedId) {
    const t = findTown(state, selectedId)
    if (t) drawSelection(ctx, worldToScreen(cam, t.x, t.y), now, su)
  }

  // Stations.
  for (const t of state.towns) {
    const s = worldToScreen(cam, t.x, t.y)
    drawStation(ctx, s.x, s.y, t.unlocked, su)
  }

  // Unlock sparkles.
  for (const fx of effects) {
    if (fx.kind !== 'unlock') continue
    const t = findTown(state, fx.town)
    if (!t) continue
    const age = (now - fx.atMs) / 900
    if (age < 0 || age > 1) continue
    drawUnlockSparkle(ctx, worldToScreen(cam, t.x, t.y), age, su)
  }

  drawTrains(ctx, state, cam, now, su)
  drawLabels(ctx, state, cam, now, effects, su)
}
