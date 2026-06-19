import { describe, it, expect } from 'vitest'
import type { Town } from '../model/types'
import { generateJobs } from './jobs'
import { makeRng } from './rng'

const towns: Town[] = [
  { id: 'A', name: 'A', x: 0, y: 0, unlocked: true, jobs: [] },
  { id: 'B', name: 'B', x: 0, y: 100, unlocked: true, jobs: [] },
  { id: 'C', name: 'C', x: 100, y: 0, unlocked: true, jobs: [] },
  { id: 'D', name: 'D', x: 50, y: 50, unlocked: false, jobs: [] }, // locked
]

const A = towns[0]!

describe('generateJobs', () => {
  it('produces the requested number of jobs', () => {
    const jobs = generateJobs(A, towns, makeRng(42), 3)
    expect(jobs).toHaveLength(3)
  })

  it('never targets the origin or a locked town', () => {
    const jobs = generateJobs(A, towns, makeRng(7), 20)
    for (const j of jobs) {
      expect(j.destination).not.toBe('A')
      expect(j.destination).not.toBe('D')
    }
  })

  it('is deterministic for a given seed', () => {
    const a = generateJobs(A, towns, makeRng(123), 5).map((j) => `${j.destination}:${j.kind}`)
    const b = generateJobs(A, towns, makeRng(123), 5).map((j) => `${j.destination}:${j.kind}`)
    expect(a).toEqual(b)
  })

  it('assigns positive payouts', () => {
    const jobs = generateJobs(A, towns, makeRng(99), 5)
    for (const j of jobs) expect(j.payout).toBeGreaterThan(0)
  })

  it('returns nothing when there are no valid destinations', () => {
    const solo: Town = { id: 'A', name: 'A', x: 0, y: 0, unlocked: true, jobs: [] }
    expect(generateJobs(solo, [solo], makeRng(1), 3)).toHaveLength(0)
  })
})
