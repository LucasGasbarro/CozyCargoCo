/** Top HUD: title, coin balance, and a reset escape hatch. */
import type { ReactNode } from 'react'
import { formatCoins } from '../game/util'
import { useGame } from './gameContext'

export function Hud(): ReactNode {
  const { state, reset } = useGame()
  return (
    <header className="hud">
      <span className="hud-title">Cozy Cargo Co.</span>
      <span className="hud-coins" aria-label="coins">
        🪙 {formatCoins(state.coins)}
      </span>
      <button
        type="button"
        className="hud-reset"
        title="Start a fresh game"
        onClick={() => {
          if (confirm('Start a brand-new game? Your current progress will be cleared.')) reset()
        }}
      >
        ↺
      </button>
    </header>
  )
}
