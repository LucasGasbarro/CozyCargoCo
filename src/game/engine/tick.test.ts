import { describe, it, expect } from 'vitest'
import type { CargoJob } from '../model/types'
import { makeState } from './_fixtures'
import { dispatchTrain } from './dispatch'
import { tick } from './tick'

function job(id: string, destination: string, payout: number): CargoJob {
  return { id, kind: 'passengers', destination, payout }
}

describe('tick', () => {
  it('does nothing before a train arrives', () => {
    const s = makeState()
    s.towns[0]!.jobs = [job('j1', 'B', 60)]
    const sent = dispatchTrain(s, 'tr-1', ['j1'], 'B', 1000)

    const { state, arrivals } = tick(sent, 50_000) // arrival is at 101_000
    expect(arrivals).toHaveLength(0)
    expect(state.coins).toBe(0)
    expect(state.trains[0]!.location.type).toBe('en-route')
  })

  it('settles an arrival, credits coins, and frees the cars', () => {
    const s = makeState()
    s.towns[0]!.jobs = [job('j1', 'B', 60)]
    const sent = dispatchTrain(s, 'tr-1', ['j1'], 'B', 1000)

    const { state, arrivals } = tick(sent, 101_000)

    expect(state.coins).toBe(60)
    expect(state.lastSeenMs).toBe(101_000)
    expect(state.trains[0]!.location).toEqual({ type: 'at-town', town: 'B' })
    expect(state.trains[0]!.cars).toHaveLength(0)
    expect(arrivals).toEqual([
      { trainId: 'tr-1', town: 'B', delivered: [job('j1', 'B', 60)], coins: 60 },
    ])
  })

  it('keeps cargo bound for other towns loaded for onward dispatch', () => {
    const s = makeState()
    s.towns[0]!.jobs = [job('j1', 'B', 60), job('j2', 'C', 90)]
    const sent = dispatchTrain(s, 'tr-1', ['j1', 'j2'], 'B', 1000)

    const { state } = tick(sent, 101_000)

    expect(state.coins).toBe(60) // only the B-bound job delivered
    expect(state.trains[0]!.cars.map((c) => c.id)).toEqual(['j2'])
  })

  it('settles offline regardless of how much time passed', () => {
    const s = makeState()
    s.towns[0]!.jobs = [job('j1', 'B', 60)]
    const sent = dispatchTrain(s, 'tr-1', ['j1'], 'B', 1000)

    const { state } = tick(sent, 999_999_999)
    expect(state.coins).toBe(60)
    expect(state.trains[0]!.location).toEqual({ type: 'at-town', town: 'B' })
  })
})
