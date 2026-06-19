/** Lines sheet: every track segment with its length, fuel cost and fastest travel time. */
import type { ReactNode } from 'react'
import type { GameState, TrackSegment } from '../game/model/types'
import { FUEL_PER_UNIT } from '../game/engine'
import { travelTimeMs } from '../game/engine/economy'
import { segKey } from '../render/map'
import { formatDuration } from './format'
import { useGame } from './gameContext'
import { playClick } from '../audio/sfx'

function townName(state: GameState, id: string): string {
  return state.towns.find((t) => t.id === id)?.name ?? id
}

/** Coins-free fuel burned to travel a segment (matches dispatch's consumption). */
function fuelCost(seg: TrackSegment): number {
  return Math.max(1, Math.round(seg.lengthUnits * FUEL_PER_UNIT))
}

/** Fastest owned train over this segment, for a friendly travel-time estimate. */
function fastestTrip(state: GameState, seg: TrackSegment): { ms: number; name: string } | null {
  let best: { ms: number; name: string } | null = null
  for (const tr of state.trains) {
    const ms = travelTimeMs(seg.lengthUnits, tr.speedUnitsPerMs)
    if (!best || ms < best.ms) best = { ms, name: tr.name }
  }
  return best
}

export function LinesSheet({
  selectedSegId,
  onSelect,
}: {
  selectedSegId: string | null
  onSelect: (segId: string) => void
}): ReactNode {
  const { state } = useGame()

  if (state.track.length === 0) {
    return <p className="panel-hint">No lines yet — unlock towns to grow your network.</p>
  }

  // Longest lines first so the costly routes are easy to spot.
  const lines = [...state.track].sort((a, b) => b.lengthUnits - a.lengthUnits)

  return (
    <ul className="line-list">
      {lines.map((seg) => {
        const id = segKey(seg.a, seg.b)
        const trip = fastestTrip(state, seg)
        return (
          <li key={id}>
            <button
              type="button"
              className={`line-card ${selectedSegId === id ? 'line-card-on' : ''}`}
              aria-pressed={selectedSegId === id}
              onClick={() => {
                onSelect(id)
                playClick()
              }}
            >
              <span className="line-card-route">
                {townName(state, seg.a)} <span aria-hidden="true">↔</span> {townName(state, seg.b)}
              </span>
              <span className="line-card-stats">
                <span title="Length">📏 {seg.lengthUnits} units</span>
                <span title="Fuel burned each trip">⛽ {fuelCost(seg)} fuel</span>
                {trip && (
                  <span title="Fastest train">
                    ⏱ {formatDuration(trip.ms)} · {trip.name}
                  </span>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
