/**
 * Game store (BasePrompt §M5): loads + reconciles the save on mount, runs a 1s tick loop that
 * settles arrivals, replenishes jobs and autosaves, and exposes player actions. Kept deliberately
 * small — a context + a couple of hooks rather than a heavyweight state library.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { GameState } from '../game/model/types'
import { dispatchTrain, replenishJobs, tick, validateDispatch, type Arrival } from '../game/engine'
import { unlockTown } from '../game/engine/growth'
import { createNewGame } from '../game/content/world'
import { localStorageSave } from '../game/save'
import { GameContext, type GameStore } from './gameContext'
import { playChime, playCoin } from '../audio/sfx'

const storage = localStorageSave()

interface Boot {
  state: GameState
  arrivals: Arrival[]
  isNew: boolean
}

/**
 * Pure startup reconciliation: read the save (or seed a new game), advance it to now, and top up
 * jobs. Deliberately does NOT persist — the autosave effect handles that — so it stays idempotent
 * under React StrictMode's double-invoked initializers and reports offline arrivals exactly once.
 */
function bootstrap(): Boot {
  const now = Date.now()
  const saved = storage.load()
  const isNew = saved === null
  const base = saved ?? createNewGame(now)
  const { state, arrivals } = tick(base, now)
  return { state: replenishJobs(state, now), arrivals, isNew }
}

export function GameProvider({ children }: { children: ReactNode }): ReactNode {
  const [boot] = useState(bootstrap)
  const [state, setState] = useState<GameState>(boot.state)
  const [now, setNow] = useState(() => Date.now())
  const [welcome, setWelcome] = useState<Arrival[] | null>(
    boot.isNew || boot.arrivals.length === 0 ? null : boot.arrivals,
  )

  // Autosave whenever state changes.
  useEffect(() => {
    storage.save(state)
  }, [state])

  // 1s loop: settle arrivals, replenish jobs, advance the clock.
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      setState((s) => {
        const ticked = tick(s, t)
        if (ticked.arrivals.length > 0) {
          playChime()
          if (ticked.arrivals.some((a) => a.coins > 0)) playCoin()
        }
        return replenishJobs(ticked.state, t)
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const dispatch = useCallback<GameStore['dispatch']>(
    (trainId, jobIds, destination) => {
      // Validate against current state so the return value is reliable (don't read a value out of
      // the async setState updater). Re-validate inside the updater to stay correct if state moved.
      const check = validateDispatch(state, trainId, jobIds, destination)
      if (!check.ok) return check.reason ?? 'Cannot dispatch'
      setState((s) =>
        validateDispatch(s, trainId, jobIds, destination).ok
          ? dispatchTrain(s, trainId, jobIds, destination, Date.now())
          : s,
      )
      return null
    },
    [state],
  )

  const unlock = useCallback<GameStore['unlock']>(
    (townId) => {
      const probe = unlockTown(state, townId, Date.now())
      if (!probe.ok) return probe.reason ?? 'Cannot unlock'
      setState((s) => {
        const res = unlockTown(s, townId, Date.now())
        return res.ok ? res.state : s
      })
      return null
    },
    [state],
  )

  const canDispatch = useCallback<GameStore['canDispatch']>(
    (trainId, jobIds, destination) => validateDispatch(state, trainId, jobIds, destination).ok,
    [state],
  )

  const dismissWelcome = useCallback(() => setWelcome(null), [])

  const reset = useCallback(() => {
    storage.clear()
    const fresh = createNewGame(Date.now())
    storage.save(fresh)
    setState(fresh)
    setWelcome(null)
  }, [])

  const value = useMemo<GameStore>(
    () => ({ state, now, welcome, dispatch, unlock, dismissWelcome, reset, canDispatch }),
    [state, now, welcome, dispatch, unlock, dismissWelcome, reset, canDispatch],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
