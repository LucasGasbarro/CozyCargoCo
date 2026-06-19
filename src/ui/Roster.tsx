/** Train roster: every locomotive with its current status and live arrival countdown. */
import type { ReactNode } from 'react'
import { trainTown } from '../game/engine'
import { formatDuration } from './format'
import { useGame } from './gameContext'

export function Roster({ onSelectTown }: { onSelectTown: (id: string) => void }): ReactNode {
  const { state, now } = useGame()
  const townName = (id: string): string => state.towns.find((t) => t.id === id)?.name ?? id

  return (
    <section className="roster">
      <h3 className="panel-section">Your trains</h3>
      <ul className="roster-list">
        {state.trains.map((train) => {
          const here = trainTown(train)
          const loaded = `${train.cars.length}/${train.carSlots}`
          if (here) {
            return (
              <li key={train.id}>
                <button type="button" className="roster-row" onClick={() => onSelectTown(here)}>
                  <span className="roster-name">🚂 {train.name}</span>
                  <span className="roster-status">Idle at {townName(here)}</span>
                  <span className="roster-cargo">📦 {loaded}</span>
                </button>
              </li>
            )
          }
          const loc = train.location
          const left = loc.type === 'en-route' ? loc.arriveAtMs - now : 0
          const to = loc.type === 'en-route' ? loc.to : ''
          return (
            <li key={train.id}>
              <button type="button" className="roster-row" onClick={() => onSelectTown(to)}>
                <span className="roster-name">🚂 {train.name}</span>
                <span className="roster-status">→ {townName(to)} · {formatDuration(left)}</span>
                <span className="roster-cargo">📦 {loaded}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
