import { describe, expect, it } from 'vitest'
import { createNewGame } from '../content/world'
import { replenishJobs, JOBS_TARGET } from './replenish'

describe('replenishJobs', () => {
  it('tops up unlocked towns to the target', () => {
    const base = createNewGame(1000, 42)
    // Drain every town's jobs to force replenishment.
    const drained = { ...base, towns: base.towns.map((t) => ({ ...t, jobs: [] })) }

    const next = replenishJobs(drained, 2000)
    for (const town of next.towns) {
      if (town.unlocked) expect(town.jobs.length).toBe(JOBS_TARGET)
      else expect(town.jobs.length).toBe(0)
    }
  })

  it('does not touch towns already at or above target', () => {
    const base = createNewGame(1000, 42)
    const before = base.towns.map((t) => t.jobs.length)
    const next = replenishJobs(base, 2000, 1)
    next.towns.forEach((t, i) => expect(t.jobs.length).toBe(before[i]))
  })

  it('generates unique job IDs that do not collide with existing ones', () => {
    const base = createNewGame(1000, 42)
    const next = replenishJobs(base, 2000, 6)
    const ids = next.towns.flatMap((t) => t.jobs.map((j) => j.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
})
