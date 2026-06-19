import { describe, it, expect } from 'vitest'
import type { CargoJob } from '../model/types'
import { makeState } from './_fixtures'
import { dispatchTrain, validateDispatch, freeSlots, neighbors } from './dispatch'

function jobTo(id: string, destination: string): CargoJob {
  return { id, kind: 'passengers', destination, payout: 50 }
}

describe('dispatch helpers', () => {
  it('lists neighbors via track', () => {
    expect(neighbors(makeState(), 'A')).toEqual(['B'])
  })
})

describe('validateDispatch', () => {
  it('accepts a valid dispatch', () => {
    const s = makeState()
    s.towns[0]!.jobs = [jobTo('j1', 'B')]
    expect(validateDispatch(s, 'tr-1', ['j1'], 'B').ok).toBe(true)
  })

  it('rejects an unconnected destination', () => {
    expect(validateDispatch(makeState(), 'tr-1', [], 'Z').ok).toBe(false)
  })

  it('rejects dispatching to the current town', () => {
    expect(validateDispatch(makeState(), 'tr-1', [], 'A').ok).toBe(false)
  })

  it('rejects overloading car slots', () => {
    const s = makeState()
    s.towns[0]!.jobs = [jobTo('j1', 'B'), jobTo('j2', 'B'), jobTo('j3', 'B'), jobTo('j4', 'B')]
    expect(validateDispatch(s, 'tr-1', ['j1', 'j2', 'j3', 'j4'], 'B').ok).toBe(false)
  })

  it('rejects jobs not available at the origin', () => {
    expect(validateDispatch(makeState(), 'tr-1', ['ghost'], 'B').ok).toBe(false)
  })
})

describe('dispatchTrain', () => {
  it('loads cargo, departs, and removes jobs from the origin', () => {
    const s = makeState()
    s.towns[0]!.jobs = [jobTo('j1', 'B')]

    const out = dispatchTrain(s, 'tr-1', ['j1'], 'B', 1000)
    const train = out.trains[0]!

    expect(train.location).toEqual({
      type: 'en-route',
      from: 'A',
      to: 'B',
      departAtMs: 1000,
      arriveAtMs: 101000, // 1000 + 100/0.001
    })
    expect(train.cars.map((c) => c.id)).toEqual(['j1'])
    expect(out.towns[0]!.jobs).toHaveLength(0)
    expect(freeSlots(train)).toBe(2)
  })

  it('does not mutate the input state', () => {
    const s = makeState()
    s.towns[0]!.jobs = [jobTo('j1', 'B')]
    dispatchTrain(s, 'tr-1', ['j1'], 'B', 1000)
    expect(s.trains[0]!.location.type).toBe('at-town')
    expect(s.towns[0]!.jobs).toHaveLength(1)
  })

  it('throws on an invalid dispatch', () => {
    expect(() => dispatchTrain(makeState(), 'tr-1', [], 'A', 0)).toThrow()
  })
})
