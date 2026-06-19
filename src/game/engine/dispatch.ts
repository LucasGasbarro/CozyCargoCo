/**
 * Dispatch logic: load chosen jobs onto a train and send it to a connected town.
 * All functions are pure — they return a new GameState, never mutate the input.
 */
import type { GameState, JobId, TownId, Train, TrainId, TrackSegment } from '../model/types'
import { travelTimeMs } from './economy'
import { FUEL_PER_UNIT, WEAR_PER_TRIP } from './trains'
import { clamp } from '../util'

export function findTown(state: GameState, id: TownId) {
  return state.towns.find((t) => t.id === id)
}

export function findTrain(state: GameState, id: TrainId) {
  return state.trains.find((t) => t.id === id)
}

/** The track segment directly connecting two towns, if any. */
export function segmentBetween(
  state: GameState,
  a: TownId,
  b: TownId,
): TrackSegment | undefined {
  return state.track.find(
    (s) => (s.a === a && s.b === b) || (s.a === b && s.b === a),
  )
}

/** Towns directly reachable from `townId` by a single track segment. */
export function neighbors(state: GameState, townId: TownId): TownId[] {
  return state.track
    .filter((s) => s.a === townId || s.b === townId)
    .map((s) => (s.a === townId ? s.b : s.a))
}

/** Whether a train is currently idle at a town. */
export function trainTown(train: Train): TownId | undefined {
  return train.location.type === 'at-town' ? train.location.town : undefined
}

/** Free cargo slots on a train. */
export function freeSlots(train: Train): number {
  return train.carSlots - train.cars.length
}

export interface DispatchValidation {
  ok: boolean
  reason?: string
}

/** Check whether a dispatch is currently legal (for UI enabling + dispatch guard). */
export function validateDispatch(
  state: GameState,
  trainId: TrainId,
  jobIds: readonly JobId[],
  destination: TownId,
): DispatchValidation {
  const train = findTrain(state, trainId)
  if (!train) return { ok: false, reason: 'Unknown train' }

  const here = trainTown(train)
  if (!here) return { ok: false, reason: 'Train is already en route' }
  if (here === destination) return { ok: false, reason: 'Destination is the current town' }

  const seg = segmentBetween(state, here, destination)
  if (!seg) return { ok: false, reason: 'No track to that town' }

  const origin = findTown(state, here)
  if (!origin) return { ok: false, reason: 'Origin town missing' }

  const destTown = findTown(state, destination)
  if (!destTown || !destTown.unlocked) return { ok: false, reason: 'Destination not unlocked' }

  if (jobIds.length > freeSlots(train)) return { ok: false, reason: 'Not enough car slots' }

  const available = new Set(origin.jobs.map((j) => j.id))
  for (const id of jobIds) {
    if (!available.has(id)) return { ok: false, reason: 'Job not available here' }
  }

  return { ok: true }
}

/**
 * Load the given jobs onto the train and depart toward `destination`.
 * Throws if the dispatch is invalid (guard with validateDispatch first in UI).
 */
export function dispatchTrain(
  state: GameState,
  trainId: TrainId,
  jobIds: readonly JobId[],
  destination: TownId,
  nowMs: number,
): GameState {
  const check = validateDispatch(state, trainId, jobIds, destination)
  if (!check.ok) throw new Error(`dispatchTrain: ${check.reason}`)

  const train = findTrain(state, trainId)!
  const here = trainTown(train)!
  const origin = findTown(state, here)!
  const seg = segmentBetween(state, here, destination)!

  const loadSet = new Set(jobIds)
  const loaded = origin.jobs.filter((j) => loadSet.has(j.id))

  const travel = travelTimeMs(seg.lengthUnits, train.speedUnitsPerMs)

  const towns = state.towns.map((t) =>
    t.id === here ? { ...t, jobs: t.jobs.filter((j) => !loadSet.has(j.id)) } : t,
  )

  const trains = state.trains.map((t) =>
    t.id === trainId
      ? {
          ...t,
          cars: [...t.cars, ...loaded],
          // The trip burns fuel by distance and adds a little wear (both tunable in trains.ts).
          fuel: clamp(t.fuel - seg.lengthUnits * FUEL_PER_UNIT, 0, t.fuelCapacity),
          damagePct: clamp(t.damagePct + WEAR_PER_TRIP, 0, 100),
          location: {
            type: 'en-route' as const,
            from: here,
            to: destination,
            departAtMs: nowMs,
            arriveAtMs: nowMs + travel,
          },
        }
      : t,
  )

  return { ...state, towns, trains }
}
