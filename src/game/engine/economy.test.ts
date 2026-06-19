import { describe, it, expect } from 'vitest'
import type { Town } from '../model/types'
import { distanceUnits, jobPayout, travelTimeMs } from './economy'

const A: Town = { id: 'A', name: 'A', x: 0, y: 0, unlocked: true, jobs: [] }
const B: Town = { id: 'B', name: 'B', x: 0, y: 100, unlocked: true, jobs: [] }

describe('economy', () => {
  it('computes Euclidean distance', () => {
    expect(distanceUnits(A, B)).toBe(100)
  })

  it('computes travel time from distance and speed', () => {
    expect(travelTimeMs(100, 0.001)).toBe(100_000)
  })

  it('rejects non-positive speed', () => {
    expect(() => travelTimeMs(100, 0)).toThrow()
  })

  it('scales payout by distance and cargo value', () => {
    expect(jobPayout(100, 'passengers')).toBe(55) // 5 + 100*0.5*1.0
    expect(jobPayout(100, 'machinery')).toBe(105) // 5 + 100*0.5*2.0
  })

  it('always pays at least the base for zero distance', () => {
    expect(jobPayout(0, 'passengers')).toBe(5)
  })
})
