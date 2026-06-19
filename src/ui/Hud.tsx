/** Top header bar: logo (left); coins, mute, reset and a Contact-us mailto (right). */
import { useState, type ReactNode } from 'react'
import { formatCoins } from '../game/util'
import { isMuted, toggleMuted } from '../audio/sfx'
import { useGame } from './gameContext'

export function Hud({
  zoomed = false,
  onResetView,
}: {
  zoomed?: boolean
  onResetView?: () => void
}): ReactNode {
  const { state, reset } = useGame()
  const [muted, setMuted] = useState(() => isMuted())

  return (
    <header className="hud">
      <div className="hud-logo">
        <span className="hud-logo-mark" aria-hidden="true">
          🚂
        </span>
        <span className="hud-logo-text">Cozy Cargo Co.</span>
      </div>

      <div className="hud-right">
        <span className="hud-coins" aria-label="coins">
          🪙 {formatCoins(state.coins)}
        </span>
        {zoomed && onResetView && (
          <button
            type="button"
            className="hud-icon"
            title="Reset view"
            aria-label="Reset map view"
            onClick={onResetView}
          >
            ⛶
          </button>
        )}
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
        <a
          className="hud-contact"
          href="mailto:lucasgasb96@gmail.com?subject=Cozy%20Cargo%20Co."
          title="Contact us"
        >
          <span aria-hidden="true">✉️</span>
          <span className="hud-contact-label">Contact us</span>
        </a>
      </div>
    </header>
  )
}
