/** Shared test fixtures (not a test file). */
import type { GameState, Train } from '../model/types'
import { SAVE_VERSION } from '../model/types'

/**
 * Two towns A(0,0) and B(0,100) connected by a 100-unit track, plus one idle train at A.
 * Train speed 0.001 units/ms => 100 units takes 100_000 ms (100s).
 */
export function makeState(overrides: Partial<GameState> = {}): GameState {
  const train: Train = {
    id: 'tr-1',
    name: 'Little Puffer',
    kind: 'steam',
    speedUnitsPerMs: 0.001,
    carSlots: 3,
    cars: [],
    location: { type: 'at-town', town: 'A' },
    fuel: 40,
    fuelCapacity: 40,
    damagePct: 0,
    value: 120,
    fuelCarts: 0,
    fuelCartSlots: 2,
  }

  return {
    version: SAVE_VERSION,
    coins: 0,
    towns: [
      { id: 'A', name: 'Ashford', x: 0, y: 0, unlocked: true, jobs: [] },
      { id: 'B', name: 'Brook', x: 0, y: 100, unlocked: true, jobs: [] },
    ],
    track: [{ a: 'A', b: 'B', lengthUnits: 100 }],
    trains: [train],
    lastSeenMs: 0,
    ...overrides,
  }
}
