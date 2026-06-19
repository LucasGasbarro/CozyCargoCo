/** Canvas map view: paints the world each animation frame and reports town taps. */
import { useEffect, useRef, type ReactNode } from 'react'
import { drawMap, makeCamera, pickTown } from '../render/map'
import { useAnimationClock, useGame } from './gameContext'

export function MapView({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (townId: string) => void
}): ReactNode {
  const { state } = useGame()
  const now = useAnimationClock()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    sizeRef.current = { w, h }
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawMap(ctx, state, now, w, h, selectedId)
  }, [now, state, selectedId])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const { w, h } = sizeRef.current
    const cam = makeCamera(state, w, h)
    const town = pickTown(state, cam, sx, sy)
    if (town) onSelect(town.id)
  }

  return (
    <canvas
      ref={canvasRef}
      className="map-canvas"
      onClick={handleClick}
      role="img"
      aria-label="Railway map. Tap a town to manage it."
    />
  )
}
