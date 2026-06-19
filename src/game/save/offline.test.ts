import { describe, it, expect } from 'vitest'
import type { CargoJob } from '../model/types'
import { makeState } from '../engine/_fixtures'
import { dispatchTrain } from '../engine/dispatch'
import { memorySave } from './storage'
import { loadGame } from './offline'

function job(id: string, destination: string, payout: number): CargoJob {
  return { id, kind: 'passengers', destination, payout }
}

describe('loadGame', () => {
  it('creates a new game when storage is empty and persists it', () => {
    const store = memorySave()
    const seed = makeState({ coins: 5 })

    const { state, isNew, arrivals } = loadGame(store, 1000, () => seed)

    expect(isNew).toBe(true)
    expect(arrivals).toHaveLength(0)
    expect(state.coins).toBe(5)
    expect(store.load()).not.toBeNull()
  })

  it('settles offline arrivals and credits coins on load', () => {
    // Dispatch a train, save it mid-journey, then "return" long after arrival.
    const s = makeState()
    s.towns[0]!.jobs = [job('j1', 'B', 80)]
    const sent = dispatchTrain(s, 'tr-1', ['j1'], 'B', 1000) // arrives at 101_000

    const store = memorySave(sent)

    const { state, arrivals } = loadGame(store, 500_000, () => sent)

    expect(state.coins).toBe(80)
    expect(state.trains[0]!.location).toEqual({ type: 'at-town', town: 'B' })
    expect(arrivals).toHaveLength(1)
    // Reconciled state was persisted.
    expect(store.load()!.coins).toBe(80)
  })

  it('does not double-credit when loaded again after settling', () => {
    const s = makeState()
    s.towns[0]!.jobs = [job('j1', 'B', 80)]
    const sent = dispatchTrain(s, 'tr-1', ['j1'], 'B', 1000)
    const store = memorySave(sent)

    loadGame(store, 500_000, () => sent)
    const second = loadGame(store, 600_000, () => sent)

    expect(second.state.coins).toBe(80)
    expect(second.arrivals).toHaveLength(0)
  })
})
