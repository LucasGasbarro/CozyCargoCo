import { describe, expect, it } from 'vitest'
import { createNewGame } from '../content/world'
import { nearestUnlocked, unlockCost, unlockTown } from './growth'
import { segmentBetween } from './dispatch'

describe('growth', () => {
  it('unlocks a locked town, builds connecting track, and charges coins', () => {
    const base = createNewGame(1000, 7)
    const rich = { ...base, coins: 10_000 }
    const link = nearestUnlocked(rich, 'mossy')!
    const cost = unlockCost(link.lengthUnits)

    const res = unlockTown(rich, 'mossy', 2000)
    expect(res.ok).toBe(true)
    const mossy = res.state.towns.find((t) => t.id === 'mossy')!
    expect(mossy.unlocked).toBe(true)
    expect(mossy.jobs.length).toBeGreaterThan(0)
    expect(segmentBetween(res.state, 'mossy', link.id)).toBeDefined()
    expect(res.state.coins).toBe(rich.coins - cost)
  })

  it('refuses when the player cannot afford it', () => {
    const base = createNewGame(1000, 7)
    const broke = { ...base, coins: 0 }
    const res = unlockTown(broke, 'mossy', 2000)
    expect(res.ok).toBe(false)
    expect(res.state).toBe(broke)
  })

  it('refuses to unlock an already-unlocked town', () => {
    const base = createNewGame(1000, 7)
    const res = unlockTown(base, 'ashford', 2000)
    expect(res.ok).toBe(false)
  })
})
