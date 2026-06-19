/**
 * Map rendering (BasePrompt §M4). All art is drawn procedurally on a 2D canvas — original cozy
 * cartoon shapes, so the MVP ships with zero third-party asset licensing to track. Pure drawing
 * helpers: given a GameState and a clock, paint towns, track and interpolated trains.
 */
import type { GameState, Town, Train } from '../game/model/types'
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

const TRAIN_COLORS: Record<Train['kind'], string> = {
  steam: '#b5651d',
  diesel: '#2f6f7e',
  electric: '#6a4c93',
}

/** Fit all towns into the given pixel box with padding, preserving aspect ratio. */
export function makeCamera(state: GameState, w: number, h: number, pad = 48): Camera {
  const xs = state.towns.map((t) => t.x)
  const ys = state.towns.map((t) => t.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const wW = maxX - minX || 1
  const wH = maxY - minY || 1
  const scale = Math.min((w - 2 * pad) / wW, (h - 2 * pad) / wH)
  const ox = pad - minX * scale + ((w - 2 * pad) - wW * scale) / 2
  const oy = pad - minY * scale + ((h - 2 * pad) - wH * scale) / 2
  return { scale, ox, oy }
}

export function worldToScreen(cam: Camera, x: number, y: number): Vec2 {
  return { x: x * cam.scale + cam.ox, y: y * cam.scale + cam.oy }
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
  radiusPx = 28,
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

/** Paint the whole scene. `selectedId` highlights one town. */
export function drawMap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  w: number,
  h: number,
  selectedId: string | null,
): void {
  const cam = makeCamera(state, w, h)

  // Cozy sky-to-meadow backdrop.
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#cde6d8')
  sky.addColorStop(1, '#a7d3b4')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  // Track first, under everything.
  ctx.lineCap = 'round'
  for (const seg of state.track) {
    const a = findTown(state, seg.a)
    const b = findTown(state, seg.b)
    if (!a || !b) continue
    const pa = worldToScreen(cam, a.x, a.y)
    const pb = worldToScreen(cam, b.x, b.y)
    ctx.strokeStyle = '#7a6a55'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
    ctx.stroke()
    // Sleepers dashes on top.
    ctx.strokeStyle = '#9b8869'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 8])
    ctx.beginPath()
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Towns.
  for (const t of state.towns) {
    const p = worldToScreen(cam, t.x, t.y)
    const r = 12
    if (t.id === selectedId) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.beginPath()
      ctx.arc(p.x, p.y, r + 8, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = t.unlocked ? '#e9b44c' : '#b9b9b9'
    ctx.strokeStyle = '#5a4632'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Little roof to read as a station.
    ctx.fillStyle = '#c0392b'
    ctx.beginPath()
    ctx.moveTo(p.x - r, p.y - 2)
    ctx.lineTo(p.x, p.y - r - 6)
    ctx.lineTo(p.x + r, p.y - 2)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = t.unlocked ? '#2c3e2e' : '#777'
    ctx.font = '600 13px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(t.unlocked ? t.name : `${t.name} 🔒`, p.x, p.y + r + 4)

    if (t.unlocked && t.jobs.length > 0) {
      ctx.fillStyle = '#2c3e2e'
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText(`${t.jobs.length} job${t.jobs.length === 1 ? '' : 's'}`, p.x, p.y + r + 20)
    }
  }

  // Trains on top.
  for (const train of state.trains) {
    const wp = trainWorldPos(state, train, now)
    if (!wp) continue
    const p = worldToScreen(cam, wp.x, wp.y)
    ctx.fillStyle = TRAIN_COLORS[train.kind]
    ctx.strokeStyle = '#3a2b1c'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(p.x - 10, p.y - 7, 20, 14, 4)
    ctx.fill()
    ctx.stroke()
    // Loaded cargo pips.
    for (let i = 0; i < train.cars.length; i++) {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(p.x - 6 + i * 6, p.y - 1, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
