/**
 * Train upkeep economy (BasePrompt §M12): passive fuel regen, paid refuel, wear & repair.
 * Pure + timestamp-driven like the rest of the engine — every function returns a new GameState.
 */
import { clamp } from '../util'
import type { GameState, Train, TrainId } from '../model/types'

/** Fuel freely loaded per real second while a train exists (litre / kg of coal). */
export const FUEL_REGEN_PER_SEC = 1
/** Flat coin cost to instantly top a train up to its full fuel capacity. */
export const FUEL_FILL_COST = 100
/** Repair cost = value × this fraction × (damage% / 100). */
export const REPAIR_COST_FRACTION = 0.2
/** Fuel burned per world unit travelled on a dispatch. */
export const FUEL_PER_UNIT = 0.04
/** Extra fuel capacity gained per attached fuel cart. */
export const FUEL_PER_CART = 20
/** Wear (in %) added to a train each time it is dispatched. */
export const WEAR_PER_TRIP = 3

/** Coins required to fully repair a train at its current damage level. */
export function repairCost(train: Train): number {
  return Math.ceil(train.value * REPAIR_COST_FRACTION * (train.damagePct / 100))
}

/** Whole seconds until passive regen tops the train back up to full fuel. */
export function fuelSecondsToFull(train: Train): number {
  const missing = Math.max(0, train.fuelCapacity - train.fuel)
  return Math.ceil(missing / FUEL_REGEN_PER_SEC)
}

/** Apply `dt` ms of passive fuel regen to a single train (clamped to capacity). */
export function regenFuel(train: Train, dtMs: number): Train {
  if (dtMs <= 0 || train.fuel >= train.fuelCapacity) return train
  const fuel = clamp(train.fuel + (dtMs / 1000) * FUEL_REGEN_PER_SEC, 0, train.fuelCapacity)
  return fuel === train.fuel ? train : { ...train, fuel }
}

export interface TrainActionResult {
  ok: boolean
  reason?: string
  state: GameState
}

function mapTrain(state: GameState, id: TrainId, fn: (t: Train) => Train): GameState {
  return { ...state, trains: state.trains.map((t) => (t.id === id ? fn(t) : t)) }
}

/** Instantly fill a train's fuel for FUEL_FILL_COST coins. */
export function refuelTrain(state: GameState, trainId: TrainId): TrainActionResult {
  const train = state.trains.find((t) => t.id === trainId)
  if (!train) return { ok: false, reason: 'Unknown train', state }
  if (train.fuel >= train.fuelCapacity) return { ok: false, reason: 'Tank already full', state }
  if (state.coins < FUEL_FILL_COST) return { ok: false, reason: 'Not enough coins', state }
  const next = mapTrain(
    { ...state, coins: state.coins - FUEL_FILL_COST },
    trainId,
    (t) => ({ ...t, fuel: t.fuelCapacity }),
  )
  return { ok: true, state: next }
}

/** Fully repair a train, paying repairCost(train) coins. */
export function repairTrain(state: GameState, trainId: TrainId): TrainActionResult {
  const train = state.trains.find((t) => t.id === trainId)
  if (!train) return { ok: false, reason: 'Unknown train', state }
  if (train.damagePct <= 0) return { ok: false, reason: 'Already in top shape', state }
  const cost = repairCost(train)
  if (state.coins < cost) return { ok: false, reason: 'Not enough coins', state }
  const next = mapTrain(
    { ...state, coins: state.coins - cost },
    trainId,
    (t) => ({ ...t, damagePct: 0 }),
  )
  return { ok: true, state: next }
}
