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
import { loadGame, localStorageSave } from '../game/save'
import { GameContext, type GameStore } from './gameContext'

const storage = localStorageSave()

export function GameProvider({ children }: { children: ReactNode }): ReactNode {
  const [state, setState] = useState<GameState>(() => {
    const { state: loaded } = loadGame(storage, Date.now(), () => createNewGame(Date.now()))
    return replenishJobs(loaded, Date.now())
  })
  const [now, setNow] = useState(() => Date.now())
  const [welcome, setWelcome] = useState<Arrival[] | null>(() => {
    // Re-derive offline arrivals on first mount for the welcome-back panel.
    const { arrivals, isNew } = loadGame(storage, Date.now(), () => createNewGame(Date.now()))
    return !isNew && arrivals.length > 0 ? arrivals : null
  })

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
        return replenishJobs(ticked.state, t)
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const dispatch = useCallback<GameStore['dispatch']>((trainId, jobIds, destination) => {
    let error: string | null = null
    setState((s) => {
      const check = validateDispatch(s, trainId, jobIds, destination)
      if (!check.ok) {
        error = check.reason ?? 'Cannot dispatch'
        return s
      }
      return dispatchTrain(s, trainId, jobIds, destination, Date.now())
    })
    return error
  }, [])

  const unlock = useCallback<GameStore['unlock']>((townId) => {
    let error: string | null = null
    setState((s) => {
      const res = unlockTown(s, townId, Date.now())
      if (!res.ok) {
        error = res.reason ?? 'Cannot unlock'
        return s
      }
      return res.state
    })
    return error
  }, [])

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
