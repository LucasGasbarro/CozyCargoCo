/** Town panel: pick jobs, load a train, choose a connected destination, and dispatch. */
import { useState, type ReactNode } from 'react'
import { formatCoins } from '../game/util'
import { CARGO_LABEL } from '../game/content/world'
import { freeSlots, neighbors, trainTown } from '../game/engine'
import { nearestUnlocked, unlockCost } from '../game/engine/growth'
import { useGame } from './gameContext'
import { playClick } from '../audio/sfx'

export function TownPanel({
  townId,
  onClose,
  hideHeader = false,
}: {
  townId: string
  onClose: () => void
  hideHeader?: boolean
}): ReactNode {
  const { state, dispatch, unlock, canDispatch } = useGame()
  const town = state.towns.find((t) => t.id === townId)

  const [trainId, setTrainId] = useState<string | null>(null)
  const [jobIds, setJobIds] = useState<string[]>([])
  const [destination, setDestination] = useState<string | null>(null)

  if (!town) return null

  if (!town.unlocked) {
    const link = nearestUnlocked(state, townId)
    const cost = link ? unlockCost(link.lengthUnits) : null
    const affordable = cost !== null && state.coins >= cost
    return (
      <section className="panel">
        {!hideHeader && <PanelHeader title={`${town.name} 🔒`} onClose={onClose} />}
        <p className="panel-hint">A sleepy town waiting to join your network.</p>
        {cost === null ? (
          <p className="panel-hint">Build out a nearby line first to reach it.</p>
        ) : (
          <button
            type="button"
            className="btn primary"
            disabled={!affordable}
            onClick={() => {
              const err = unlock(townId)
              if (err) alert(err)
              else playClick()
            }}
          >
            Connect & unlock — 🪙 {formatCoins(cost)}
            {!affordable ? ' (not enough)' : ''}
          </button>
        )}
      </section>
    )
  }

  const idleHere = state.trains.filter((t) => trainTown(t) === townId)
  const activeTrainId = trainId ?? idleHere[0]?.id ?? null
  const activeTrain = idleHere.find((t) => t.id === activeTrainId) ?? null
  const free = activeTrain ? freeSlots(activeTrain) : 0

  const destinationTowns = neighbors(state, townId)
    .map((id) => state.towns.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => !!t && t.unlocked)

  const toggleJob = (id: string): void => {
    setJobIds((cur) =>
      cur.includes(id) ? cur.filter((j) => j !== id) : cur.length < free ? [...cur, id] : cur,
    )
  }

  const ready =
    !!activeTrain && !!destination && canDispatch(activeTrain.id, jobIds, destination)

  const onDispatch = (): void => {
    if (!activeTrain || !destination) return
    const err = dispatch(activeTrain.id, jobIds, destination)
    if (err) {
      alert(err)
      return
    }
    playClick()
    setJobIds([])
    setDestination(null)
  }

  return (
    <section className="panel">
      {!hideHeader && <PanelHeader title={town.name} onClose={onClose} />}

      <h3 className="panel-section">Trains here</h3>
      {idleHere.length === 0 ? (
        <p className="panel-hint">No idle trains here right now.</p>
      ) : (
        <div className="chip-row">
          {idleHere.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${t.id === activeTrainId ? 'chip-on' : ''}`}
              onClick={() => {
                setTrainId(t.id)
                setJobIds([])
              }}
            >
              🚂 {t.name} ({freeSlots(t)}/{t.carSlots})
            </button>
          ))}
        </div>
      )}

      <h3 className="panel-section">
        Cargo to haul {activeTrain ? `· ${jobIds.length}/${free} loaded` : ''}
      </h3>
      {town.jobs.length === 0 ? (
        <p className="panel-hint">No jobs waiting — check back soon.</p>
      ) : (
        <ul className="job-list">
          {town.jobs.map((job) => {
            const destName = state.towns.find((t) => t.id === job.destination)?.name ?? job.destination
            const checked = jobIds.includes(job.id)
            const disabled = !activeTrain || (!checked && jobIds.length >= free)
            return (
              <li key={job.id}>
                <label className={`job ${disabled && !checked ? 'job-disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleJob(job.id)}
                  />
                  <span className="job-kind">{CARGO_LABEL[job.kind]}</span>
                  <span className="job-dest">→ {destName}</span>
                  <span className="job-pay">🪙 {formatCoins(job.payout)}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}

      <h3 className="panel-section">Send to</h3>
      {destinationTowns.length === 0 ? (
        <p className="panel-hint">No connected towns yet.</p>
      ) : (
        <div className="chip-row">
          {destinationTowns.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${t.id === destination ? 'chip-on' : ''}`}
              onClick={() => setDestination(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      <button type="button" className="btn primary dispatch" disabled={!ready} onClick={onDispatch}>
        Dispatch 🚂
      </button>
    </section>
  )
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }): ReactNode {
  return (
    <div className="panel-head">
      <h2>{title}</h2>
      <button type="button" className="panel-close" aria-label="Close" onClick={onClose}>
        ✕
      </button>
    </div>
  )
}
