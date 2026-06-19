/**
 * Game load + offline-progress reconciliation.
 *
 * On startup we load the saved state (or create a new game), then advance it to "now" via the
 * engine tick so any trains that arrived while the tab was closed are settled and their coins
 * credited. The settled arrivals feed the "welcome back" summary (BasePrompt §13).
 */
import type { GameState } from '../model/types'
import { tick, type Arrival } from '../engine/tick'
import type { SaveStorage } from './storage'

export interface LoadResult {
  state: GameState
  /** Arrivals that were settled during offline reconciliation (may be empty). */
  arrivals: Arrival[]
  /** True when no prior save existed and a fresh game was created. */
  isNew: boolean
}

/**
 * Load and reconcile the game to `nowMs`. If no save exists, `createNew` seeds a fresh game.
 * The reconciled state is persisted before returning.
 */
export function loadGame(
  storage: SaveStorage,
  nowMs: number,
  createNew: () => GameState,
): LoadResult {
  const saved = storage.load()
  const isNew = saved === null
  const base = saved ?? createNew()

  const { state, arrivals } = tick(base, nowMs)
  storage.save(state)

  return { state, arrivals, isNew }
}
