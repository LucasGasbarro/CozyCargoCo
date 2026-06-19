import { describe, it, expect } from 'vitest'
import { createNewGame, STARTING_COINS } from './world'
import { neighbors } from '../engine/dispatch'

describe('createNewGame', () => {
  it('seeds the expected starter content', () => {
    const g = createNewGame(1000, 42)
    expect(g.coins).toBe(STARTING_COINS)
    expect(g.towns).toHaveLength(12)
    expect(g.trains).toHaveLength(2)
    expect(g.lastSeenMs).toBe(1000)
  })

  it('starts with four unlocked, connected towns', () => {
    const g = createNewGame(1000, 42)
    const unlocked = g.towns.filter((t) => t.unlocked)
    expect(unlocked).toHaveLength(4)
    // Ashford connects to Brookwell and Cedar Hollow.
    expect(neighbors(g, 'ashford').sort()).toEqual(['brook', 'cedar'])
  })

  it('offers jobs only at unlocked towns, destined elsewhere', () => {
    const g = createNewGame(1000, 42)
    for (const town of g.towns) {
      if (!town.unlocked) {
        expect(town.jobs).toHaveLength(0)
        continue
      }
      for (const job of town.jobs) {
        expect(job.destination).not.toBe(town.id)
        const dest = g.towns.find((t) => t.id === job.destination)
        expect(dest?.unlocked).toBe(true)
      }
    }
  })

  it('parks both trains at Ashford with empty cars', () => {
    const g = createNewGame(1000, 42)
    for (const train of g.trains) {
      expect(train.location).toEqual({ type: 'at-town', town: 'ashford' })
      expect(train.cars).toHaveLength(0)
    }
  })

  it('is deterministic for a given seed', () => {
    expect(createNewGame(1000, 7)).toEqual(createNewGame(1000, 7))
  })
})
