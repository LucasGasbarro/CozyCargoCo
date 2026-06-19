/** Train sheet: per-train stats (fuel, damage, carts) with paid Fill-fuel and Repair actions. */
import type { ReactNode } from 'react'
import type { Train } from '../game/model/types'
import { formatCoins } from '../game/util'
import {
  FUEL_FILL_COST,
  fuelSecondsToFull,
  repairCost,
  trainTown,
} from '../game/engine'
import { formatDuration } from './format'
import { useGame } from './gameContext'
import { playClick } from '../audio/sfx'

export function TrainSheet(): ReactNode {
  const { state } = useGame()
  return (
    <ul className="train-list">
      {state.trains.map((train) => (
        <li key={train.id}>
          <TrainCard train={train} />
        </li>
      ))}
    </ul>
  )
}

const KIND_LABEL: Record<Train['kind'], string> = {
  steam: 'Steam',
  diesel: 'Diesel',
  electric: 'Electric',
}

function TrainCard({ train }: { train: Train }): ReactNode {
  const { state, now, refuel, repair } = useGame()

  const here = trainTown(train)
  const townName = (id: string): string => state.towns.find((t) => t.id === id)?.name ?? id
  let status = here ? `Idle at ${townName(here)}` : ''
  if (!here && train.location.type === 'en-route') {
    status = `→ ${townName(train.location.to)} · ${formatDuration(train.location.arriveAtMs - now)}`
  }

  const fuelPct = Math.round((train.fuel / train.fuelCapacity) * 100)
  const full = train.fuel >= train.fuelCapacity
  const toFull = fuelSecondsToFull(train)
  const cost = repairCost(train)
  const canFill = !full && state.coins >= FUEL_FILL_COST
  const canFix = train.damagePct > 0 && state.coins >= cost

  return (
    <article className="train-card">
      <header className="train-card-head">
        <span className="train-card-name">🚂 {train.name}</span>
        <span className="train-card-kind">{KIND_LABEL[train.kind]}</span>
      </header>
      <p className="train-card-status">{status}</p>

      <div className="stat">
        <div className="stat-row">
          <span className="stat-label">⛽ Fuel</span>
          <span className="stat-val">
            {Math.floor(train.fuel)} / {train.fuelCapacity}
            {full ? ' · full' : ` · full in ${formatDuration(toFull * 1000)}`}
          </span>
        </div>
        <div className="meter">
          <span className="meter-fill fuel" style={{ width: `${fuelPct}%` }} />
        </div>
        <button
          type="button"
          className="btn small"
          disabled={!canFill}
          onClick={() => {
            const err = refuel(train.id)
            if (err) alert(err)
            else playClick()
          }}
        >
          {full ? 'Tank full' : `Fill up — 🪙 ${formatCoins(FUEL_FILL_COST)}`}
        </button>
      </div>

      <div className="stat">
        <div className="stat-row">
          <span className="stat-label">🔧 Damage</span>
          <span className="stat-val">{Math.round(train.damagePct)}%</span>
        </div>
        <div className="meter">
          <span className="meter-fill damage" style={{ width: `${Math.round(train.damagePct)}%` }} />
        </div>
        <button
          type="button"
          className="btn small"
          disabled={!canFix}
          onClick={() => {
            const err = repair(train.id)
            if (err) alert(err)
            else playClick()
          }}
        >
          {train.damagePct <= 0 ? 'In top shape' : `Repair — 🪙 ${formatCoins(cost)}`}
        </button>
      </div>

      <div className="train-card-meta">
        <span>📦 Cargo carts: {train.carSlots}</span>
        <span>
          ⛽ Fuel carts: {train.fuelCarts}/{train.fuelCartSlots}
        </span>
      </div>
    </article>
  )
}
