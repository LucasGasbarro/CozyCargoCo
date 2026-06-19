/** Welcome-back summary: what arrived and how many coins were earned while away. */
import type { ReactNode } from 'react'
import { formatCoins } from '../game/util'
import { CARGO_LABEL } from '../game/content/world'
import { useGame } from './gameContext'

export function WelcomeBack(): ReactNode {
  const { state, welcome, dismissWelcome } = useGame()
  if (!welcome || welcome.length === 0) return null

  const total = welcome.reduce((sum, a) => sum + a.coins, 0)
  const townName = (id: string): string => state.towns.find((t) => t.id === id)?.name ?? id

  return (
    <div className="overlay" role="dialog" aria-label="Welcome back">
      <div className="modal">
        <h2>Welcome back! 👋</h2>
        <p>While you were away, your trains kept rolling:</p>
        <ul className="welcome-list">
          {welcome.map((a, i) => (
            <li key={`${a.trainId}-${i}`}>
              <strong>{townName(a.town)}</strong>
              <span>
                {a.delivered.length > 0
                  ? a.delivered.map((j) => CARGO_LABEL[j.kind]).join(', ')
                  : 'arrived empty'}
              </span>
              <span className="welcome-coins">🪙 {formatCoins(a.coins)}</span>
            </li>
          ))}
        </ul>
        <p className="welcome-total">Total earned: 🪙 {formatCoins(total)}</p>
        <button type="button" className="btn primary" onClick={dismissWelcome}>
          Let’s keep going
        </button>
      </div>
    </div>
  )
}
