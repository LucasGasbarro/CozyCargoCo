/**
 * Network growth (BasePrompt §M6): spend coins to unlock a new town. Unlocking automatically lays
 * track to the nearest already-unlocked town (cost scales with that distance) and seeds the new
 * town with jobs, so the player's cozy network expands one stop at a time. Pure: returns a new
 * GameState, never mutates.
 */
import type { GameState, TownId, TrackSegment } from '../model/types'
import { distanceUnits } from './economy'
import { findTown, segmentBetween } from './dispatch'
import { replenishJobs } from './replenish'

/** Base coins for any expansion, before distance scaling. */
export const UNLOCK_BASE = 30
/** Coins charged per world unit of new track laid. */
export const UNLOCK_PER_UNIT = 0.25

export interface GrowthResult {
  ok: boolean
  reason?: string
  state: GameState
}

/** Cost to unlock a town, given the distance of the track that will connect it. */
export function unlockCost(lengthUnits: number): number {
  return Math.round(UNLOCK_BASE + lengthUnits * UNLOCK_PER_UNIT)
}

/** The nearest unlocked town to `townId`, with the distance between them. */
export function nearestUnlocked(
  state: GameState,
  townId: TownId,
): { id: TownId; lengthUnits: number } | undefined {
  const target = findTown(state, townId)
  if (!target) return undefined
  let best: { id: TownId; lengthUnits: number } | undefined
  for (const t of state.towns) {
    if (!t.unlocked || t.id === townId) continue
    const d = distanceUnits(target, t)
    if (!best || d < best.lengthUnits) best = { id: t.id, lengthUnits: d }
  }
  return best
}

/**
 * Unlock `townId`: connect it to the nearest unlocked town, deduct the cost, and seed jobs.
 * Fails (ok:false) if the town is unknown, already unlocked, has no unlocked neighbour, or the
 * player can't afford it.
 */
export function unlockTown(state: GameState, townId: TownId, nowMs: number): GrowthResult {
  const town = findTown(state, townId)
  if (!town) return { ok: false, reason: 'Unknown town', state }
  if (town.unlocked) return { ok: false, reason: 'Already unlocked', state }

  const link = nearestUnlocked(state, townId)
  if (!link) return { ok: false, reason: 'No connecting town yet', state }

  const cost = unlockCost(link.lengthUnits)
  if (state.coins < cost) return { ok: false, reason: `Need ${cost} coins`, state }

  const towns = state.towns.map((t) => (t.id === townId ? { ...t, unlocked: true } : t))

  const track: TrackSegment[] = segmentBetween(state, townId, link.id)
    ? state.track
    : [...state.track, { a: townId, b: link.id, lengthUnits: Math.round(link.lengthUnits) }]

  const grown: GameState = { ...state, coins: state.coins - cost, towns, track }
  return { ok: true, state: replenishJobs(grown, nowMs) }
}
