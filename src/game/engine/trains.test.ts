import { describe, it, expect } from 'vitest'
import { makeState } from './_fixtures'
import {
  FUEL_FILL_COST,
  fuelSecondsToFull,
  refuelTrain,
  repairCost,
  repairTrain,
} from './trains'
import { tick } from './tick'

describe('train fuel economy', () => {
  it('regenerates fuel passively over elapsed time (capped at capacity)', () => {
    const s = makeState({ lastSeenMs: 0 })
    s.trains[0]!.fuel = 10 // capacity 40

    const after5s = tick(s, 5_000).state
    expect(after5s.trains[0]!.fuel).toBe(15)

    const afterAges = tick(s, 999_999_999).state
    expect(afterAges.trains[0]!.fuel).toBe(40) // clamped to capacity
  })

  it('reports whole seconds until full', () => {
    const s = makeState()
    s.trains[0]!.fuel = 31.5 // capacity 40 -> 8.5 missing -> ceil = 9s
    expect(fuelSecondsToFull(s.trains[0]!)).toBe(9)
  })

  it('fills the tank for a flat coin cost', () => {
    const s = makeState({ coins: FUEL_FILL_COST })
    s.trains[0]!.fuel = 5
    const res = refuelTrain(s, 'tr-1')
    expect(res.ok).toBe(true)
    expect(res.state.coins).toBe(0)
    expect(res.state.trains[0]!.fuel).toBe(40)
  })

  it('refuses to fill when broke or already full', () => {
    const broke = makeState({ coins: 0 })
    broke.trains[0]!.fuel = 5
    expect(refuelTrain(broke, 'tr-1').ok).toBe(false)

    const full = makeState({ coins: 999 })
    expect(refuelTrain(full, 'tr-1').ok).toBe(false)
  })

  it('derives repair cost from value, fraction and damage', () => {
    const s = makeState()
    s.trains[0]!.value = 200
    s.trains[0]!.damagePct = 50
    expect(repairCost(s.trains[0]!)).toBe(20) // ceil(200 * 0.2 * 0.5)
  })

  it('repairs a damaged train, charging the derived cost', () => {
    const s = makeState({ coins: 100 })
    s.trains[0]!.value = 200
    s.trains[0]!.damagePct = 50
    const res = repairTrain(s, 'tr-1')
    expect(res.ok).toBe(true)
    expect(res.state.coins).toBe(80)
    expect(res.state.trains[0]!.damagePct).toBe(0)
  })

  it('refuses to repair an undamaged train or when broke', () => {
    const undamaged = makeState({ coins: 100 })
    expect(repairTrain(undamaged, 'tr-1').ok).toBe(false)

    const broke = makeState({ coins: 0 })
    broke.trains[0]!.value = 200
    broke.trains[0]!.damagePct = 50
    expect(repairTrain(broke, 'tr-1').ok).toBe(false)
  })
})
