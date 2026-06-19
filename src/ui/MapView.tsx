/** Canvas map view: paints the world each frame, reports town + line taps, and handles pan + zoom. */
import { useEffect, useRef, type ReactNode } from 'react'
import { drawMap, pickSegment, pickTown, segKey, viewTransform, type View } from '../render/map'
import { clamp } from '../game/util'
import { useAnimationClock, useGame } from './gameContext'

const ZOOM_MIN = 0.9
const ZOOM_MAX = 2.6

/** Keep zoom in range and pan within sensible bounds so content can't be dragged fully off-screen. */
function clampView(v: View, w: number, h: number): View {
  const zoom = clamp(v.zoom, ZOOM_MIN, ZOOM_MAX)
  const maxX = Math.max(0, zoom - 1) * w * 0.5 + 30
  const maxY = Math.max(0, zoom - 1) * h * 0.5 + 30
  return { zoom, panX: clamp(v.panX, -maxX, maxX), panY: clamp(v.panY, -maxY, maxY) }
}

/** Zoom by `factor` while keeping the point (ax,ay) anchored under the cursor / pinch midpoint. */
function zoomAround(v: View, factor: number, ax: number, ay: number, w: number, h: number): View {
  const z2 = clamp(v.zoom * factor, ZOOM_MIN, ZOOM_MAX)
  if (z2 === v.zoom) return v
  const dx = ax - w / 2
  const dy = ay - h / 2
  const r = z2 / v.zoom
  return clampView({ zoom: z2, panX: dx - r * (dx - v.panX), panY: dy - r * (dy - v.panY) }, w, h)
}

export function MapView({
  selectedId,
  selectedSegId,
  view,
  onView,
  onSelect,
  onSelectSegment,
}: {
  selectedId: string | null
  selectedSegId: string | null
  view: View
  onView: (v: View) => void
  onSelect: (townId: string) => void
  onSelectSegment: (segId: string) => void
}): ReactNode {
  const { state, effects } = useGame()
  const now = useAnimationClock()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sizeRef = useRef({ w: 0, h: 0 })

  // Latest view in a ref so gesture handlers always read current values without re-binding.
  const viewRef = useRef(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])

  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const lastRef = useRef<{ x: number; y: number } | null>(null)
  const pinchRef = useRef<{ dist: number; mx: number; my: number } | null>(null)
  const movedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    sizeRef.current = { w, h }
    // Only reallocate the backing bitmap when the element actually changed size — resizing every
    // animation frame would needlessly clear + reallocate the canvas and thrash performance.
    const pxW = Math.round(w * dpr)
    const pxH = Math.round(h * dpr)
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW
      canvas.height = pxH
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawMap(ctx, state, now, w, h, selectedId, selectedSegId, effects, view)
  }, [now, state, selectedId, selectedSegId, effects, view])

  // Non-passive wheel listener so we can preventDefault (stop the page scrolling) while zooming.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const { w, h } = sizeRef.current
      const factor = Math.exp(-e.deltaY * 0.0015)
      onView(zoomAround(viewRef.current, factor, e.clientX - rect.left, e.clientY - rect.top, w, h))
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [onView])

  const relPos = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const doSelect = (sx: number, sy: number): void => {
    const { w, h } = sizeRef.current
    const { cssCam } = viewTransform(state, w, h, viewRef.current)
    // Towns (nodes) take priority; fall back to picking a line between them.
    const town = pickTown(state, cssCam, sx, sy)
    if (town) {
      onSelect(town.id)
      return
    }
    const seg = pickSegment(state, cssCam, sx, sy)
    if (seg) onSelectSegment(segKey(seg.a, seg.b))
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    canvasRef.current?.setPointerCapture(e.pointerId)
    const p = relPos(e)
    pointers.current.set(e.pointerId, p)
    movedRef.current = false
    const pts = [...pointers.current.values()]
    if (pts.length === 2) {
      const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }]
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
      lastRef.current = null
    } else {
      lastRef.current = p
      pinchRef.current = null
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!pointers.current.has(e.pointerId)) return
    const p = relPos(e)
    pointers.current.set(e.pointerId, p)
    const { w, h } = sizeRef.current
    const pts = [...pointers.current.values()]

    if (pts.length >= 2 && pinchRef.current) {
      // Two-finger pinch: zoom about the midpoint and pan to follow the midpoint drift.
      const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      const prev = pinchRef.current
      const factor = prev.dist > 0 ? dist / prev.dist : 1
      const zoomed = zoomAround(viewRef.current, factor, mx, my, w, h)
      const next = clampView(
        { ...zoomed, panX: zoomed.panX + (mx - prev.mx), panY: zoomed.panY + (my - prev.my) },
        w,
        h,
      )
      pinchRef.current = { dist, mx, my }
      movedRef.current = true
      onView(next)
    } else if (lastRef.current) {
      const dx = p.x - lastRef.current.x
      const dy = p.y - lastRef.current.y
      if (Math.abs(dx) + Math.abs(dy) > 3) movedRef.current = true
      lastRef.current = p
      if (movedRef.current) {
        const v = viewRef.current
        onView(clampView({ ...v, panX: v.panX + dx, panY: v.panY + dy }, w, h))
      }
    }
  }

  const endPointer = (e: React.PointerEvent<HTMLCanvasElement>, select: boolean): void => {
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* capture may already be gone */
    }
    const had = pointers.current.has(e.pointerId)
    const p = relPos(e)
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 1) {
      lastRef.current = [...pointers.current.values()][0] ?? null
      pinchRef.current = null
    } else if (pointers.current.size === 0) {
      // A tap (down→up without crossing the drag threshold) selects a town or line.
      if (select && had && !movedRef.current) doSelect(p.x, p.y)
      lastRef.current = null
      pinchRef.current = null
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="map-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endPointer(e, true)}
      onPointerCancel={(e) => endPointer(e, false)}
      role="img"
      aria-label="Railway map. Tap a town or line; drag to pan, scroll or pinch to zoom."
    />
  )
}
