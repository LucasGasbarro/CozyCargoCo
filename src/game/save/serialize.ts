/**
 * Versioned (de)serialization of GameState. Pure; no storage I/O here.
 */
import type { GameState } from '../model/types'
import { SAVE_VERSION } from '../model/types'

export function serialize(state: GameState): string {
  return JSON.stringify(state)
}

/** Narrow an unknown parsed value to a GameState, throwing on anything unexpected. */
function assertGameState(data: unknown): asserts data is GameState {
  if (typeof data !== 'object' || data === null) {
    throw new Error('corrupt save: not an object')
  }
  const d = data as Record<string, unknown>
  if (d.version !== SAVE_VERSION) {
    throw new Error(`unsupported save version: ${String(d.version)}`)
  }
  if (
    typeof d.coins !== 'number' ||
    !Array.isArray(d.towns) ||
    !Array.isArray(d.track) ||
    !Array.isArray(d.trains) ||
    typeof d.lastSeenMs !== 'number'
  ) {
    throw new Error('corrupt save: missing required fields')
  }
}

/**
 * Parse a serialized save back into a GameState.
 * Throws on corrupt or unsupported data so callers can fall back to a new game.
 */
export function deserialize(json: string): GameState {
  const parsed: unknown = JSON.parse(json)
  assertGameState(parsed)
  return parsed
}
