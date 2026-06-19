/**
 * Save storage adapters. The interface is deliberately small so we can swap localStorage for
 * IndexedDB or a cloud backend later (BasePrompt §11 persistence) without touching game logic.
 */
import type { GameState } from '../model/types'
import { deserialize, serialize } from './serialize'

export interface SaveStorage {
  load(): GameState | null
  save(state: GameState): void
  clear(): void
}

export const SAVE_KEY = 'cozy-cargo-co/save'

function localStorageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

/** Persist to the browser's localStorage. Corrupt/absent saves load as null (start fresh). */
export function localStorageSave(key: string = SAVE_KEY): SaveStorage {
  return {
    load() {
      if (!localStorageAvailable()) return null
      const raw = localStorage.getItem(key)
      if (raw === null) return null
      try {
        return deserialize(raw)
      } catch {
        return null
      }
    },
    save(state) {
      if (!localStorageAvailable()) return
      localStorage.setItem(key, serialize(state))
    },
    clear() {
      if (!localStorageAvailable()) return
      localStorage.removeItem(key)
    },
  }
}

/** In-memory adapter, handy for tests and SSR. */
export function memorySave(initial: GameState | null = null): SaveStorage {
  let current: string | null = initial ? serialize(initial) : null
  return {
    load() {
      if (current === null) return null
      try {
        return deserialize(current)
      } catch {
        return null
      }
    },
    save(state) {
      current = serialize(state)
    },
    clear() {
      current = null
    },
  }
}
