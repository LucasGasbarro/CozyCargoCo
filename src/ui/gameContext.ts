/**
 * Game context + hooks, kept separate from the provider component so the module exports only
 * non-component values (satisfies react-refresh and keeps the store file component-only).
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { GameState, JobId, TownId, TrainId } from '../game/model/types'
import type { Arrival } from '../game/engine'

export interface GameStore {
  state: GameState
  /** A clock that ticks ~1s for countdowns (kept separate from per-frame render time). */
  now: number
  /** Offline arrivals to show in the welcome-back summary, or null when dismissed. */
  welcome: Arrival[] | null
  dispatch(trainId: TrainId, jobIds: readonly JobId[], destination: TownId): string | null
  unlock(townId: TownId): string | null
  dismissWelcome(): void
  reset(): void
  canDispatch(trainId: TrainId, jobIds: readonly JobId[], destination: TownId): boolean
}

export const GameContext = createContext<GameStore | null>(null)

export function useGame(): GameStore {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within a GameProvider')
  return ctx
}

/** A high-frequency animation clock for smooth canvas motion (requestAnimationFrame). */
export function useAnimationClock(): number {
  const [t, setT] = useState(() => Date.now())
  const raf = useRef(0)
  useEffect(() => {
    const loop = (): void => {
      setT(Date.now())
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [])
  return t
}
