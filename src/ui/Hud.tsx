/** Top HUD: title, coin balance, mute toggle, and a reset escape hatch. */
import { useState, type ReactNode } from 'react'
import { formatCoins } from '../game/util'
import { isMuted, toggleMuted } from '../audio/sfx'
import { useGame } from './gameContext'

export function Hud(): ReactNode {
  const { state, reset } = useGame()
  const [muted, setMuted] = useState(() => isMuted())

  return (
    <header className="hud">
      <span className="hud-title">Cozy Cargo Co.</span>
      <span className="hud-coins" aria-label="coins">
        🪙 {formatCoins(state.coins)}
      </span>
      <button
        type="button"
        className="hud-icon"
        title={muted ? 'Unmute sound' : 'Mute sound'}
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        aria-pressed={muted}
        onClick={() => setMuted(toggleMuted())}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      <button
        type="button"
        className="hud-icon"
        title="Start a fresh game"
        aria-label="Start a fresh game"
        onClick={() => {
          if (confirm('Start a brand-new game? Your current progress will be cleared.')) reset()
        }}
      >
        ↺
      </button>
    </header>
  )
}
