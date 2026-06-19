/**
 * Game store (BasePrompt §M5): loads + reconciles the save on mount, runs a 1s tick loop that
 * settles arrivals, replenishes jobs and autosaves, and exposes player actions. Kept deliberately
 * small — a context + a couple of hooks rather than a heavyweight state library.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { GameState } from '../game/model/types'
import { dispatchTrain, refuelTrain, repairTrain, replenishJobs, tick, validateDispatch, type Arrival } from '../game/engine'
import { unlockTown } from '../game/engine/growth'
import { createNewGame } from '../game/content/world'
import { localStorageSave } from '../game/save'
import { GameContext, type GameStore } from './gameContext'
import type { MapEffect } from '../render/map'
import { playChime, playCoin } from '../audio/sfx'

const storage = localStorageSave()

/** Drop juice effects that have already finished animating. */
function pruneEffects(list: MapEffect[], now: number): MapEffect[] {
  return list.filter((e) => now - e.atMs < 2000)
}

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
  const [effects, setEffects] = useState<MapEffect[]>([])
  const [welcome, setWelcome] = useState<Arrival[] | null>(
    boot.isNew || boot.arrivals.length === 0 ? null : boot.arrivals,
  )

  // Latest state mirror so the tick loop can read it without a stale closure or doing side effects
  // inside a setState updater (which StrictMode would double-invoke).
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Autosave whenever state changes.
  useEffect(() => {
    storage.save(state)
  }, [state])

  // 1s loop: settle arrivals (+ emit juice), replenish jobs, advance the clock.
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now()
      const ticked = tick(stateRef.current, t)
      if (ticked.arrivals.length > 0) {
        playChime()
        const paid = ticked.arrivals.filter((a) => a.coins > 0)
        if (paid.length > 0) {
          playCoin()
          const coinFx: MapEffect[] = paid.map((a) => ({
            id: `coin-${a.trainId}-${a.town}-${t}`,
            kind: 'coin',
            town: a.town,
            atMs: t,
            amount: a.coins,
          }))
          setEffects((prev) => pruneEffects([...prev, ...coinFx], t))
        }
      }
      setState(replenishJobs(ticked.state, t))
      setNow(t)
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
      const t = Date.now()
      setState((s) => {
        const res = unlockTown(s, townId, Date.now())
        return res.ok ? res.state : s
      })
      setEffects((prev) =>
        pruneEffects([...prev, { id: `unlock-${townId}-${t}`, kind: 'unlock', town: townId, atMs: t }], t),
      )
      return null
    },
    [state],
  )

  const canDispatch = useCallback<GameStore['canDispatch']>(
    (trainId, jobIds, destination) => validateDispatch(state, trainId, jobIds, destination).ok,
    [state],
  )

  const refuel = useCallback<GameStore['refuel']>(
    (trainId) => {
      const probe = refuelTrain(state, trainId)
      if (!probe.ok) return probe.reason ?? 'Cannot refuel'
      setState((s) => {
        const res = refuelTrain(s, trainId)
        return res.ok ? res.state : s
      })
      return null
    },
    [state],
  )

  const repair = useCallback<GameStore['repair']>(
    (trainId) => {
      const probe = repairTrain(state, trainId)
      if (!probe.ok) return probe.reason ?? 'Cannot repair'
      setState((s) => {
        const res = repairTrain(s, trainId)
        return res.ok ? res.state : s
      })
      return null
    },
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
    () => ({ state, now, welcome, effects, dispatch, unlock, refuel, repair, dismissWelcome, reset, canDispatch }),
    [state, now, welcome, effects, dispatch, unlock, refuel, repair, dismissWelcome, reset, canDispatch],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
