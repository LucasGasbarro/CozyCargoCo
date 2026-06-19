/**
 * Time advancement / arrival settlement. Pure and timestamp-driven so it doubles as the
 * offline-progress engine: call tick(state, Date.now()) on load and earnings settle exactly.
 */
import type { CargoJob, GameState, TownId, TrainId } from '../model/types'
import { regenFuel } from './trains'

/** A single train arrival settled during a tick (feeds the "welcome back" summary). */
export interface Arrival {
  trainId: TrainId
  town: TownId
  delivered: CargoJob[]
  coins: number
}

export interface TickResult {
  state: GameState
  arrivals: Arrival[]
}

/**
 * Advance the game to `nowMs`: any en-route train whose arrival time has passed is moved to its
 * destination, cargo bound for that town is delivered (coins credited), and the rest stays loaded
 * for onward dispatch. Trains then sit idle until the player dispatches them again.
 */
export function tick(state: GameState, nowMs: number): TickResult {
  const arrivals: Arrival[] = []
  let coinsGained = 0
  const dt = Math.max(0, nowMs - state.lastSeenMs)

  const trains = state.trains.map((train0) => {
    // Passive fuel regen for every train, based on real elapsed time (so offline refuels too).
    const train = regenFuel(train0, dt)

    if (train.location.type !== 'en-route' || nowMs < train.location.arriveAtMs) {
      return train
    }

    const town = train.location.to
    const delivered: CargoJob[] = []
    const remaining: CargoJob[] = []
    for (const job of train.cars) {
      if (job.destination === town) delivered.push(job)
      else remaining.push(job)
    }

    const coins = delivered.reduce((sum, j) => sum + j.payout, 0)
    coinsGained += coins
    arrivals.push({ trainId: train.id, town, delivered, coins })

    return {
      ...train,
      cars: remaining,
      location: { type: 'at-town' as const, town },
    }
  })

  return {
    state: {
      ...state,
      coins: state.coins + coinsGained,
      trains,
      lastSeenMs: nowMs,
    },
    arrivals,
  }
}
