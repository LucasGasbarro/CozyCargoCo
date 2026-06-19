/**
 * Economy & physics formulas (BasePrompt §11 economy). Pure and deterministic.
 */
import { CARGO_VALUE, type CargoKind, type Town } from '../model/types'

/** Euclidean distance between two towns in world units. */
export function distanceUnits(a: Town, b: Town): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** Real-time travel duration (ms) for a distance at a given speed. */
export function travelTimeMs(lengthUnits: number, speedUnitsPerMs: number): number {
  if (speedUnitsPerMs <= 0) throw new Error('travelTimeMs: speed must be > 0')
  return Math.max(1, Math.round(lengthUnits / speedUnitsPerMs))
}

/** Base coin reward per job, before distance/cargo scaling. */
export const PAYOUT_BASE = 5
/** Coins per world unit of distance, before cargo multiplier. */
export const PAYOUT_PER_UNIT = 0.5

/** Coin payout for delivering `kind` cargo over `lengthUnits` of distance. */
export function jobPayout(lengthUnits: number, kind: CargoKind): number {
  const value = CARGO_VALUE[kind]
  return Math.round(PAYOUT_BASE + lengthUnits * PAYOUT_PER_UNIT * value)
}
