/** Bottom menu bar over the full-screen map: Jobs / Station / Train. */
import type { ReactNode } from 'react'

export type SheetId = 'jobs' | 'station' | 'train'

export function BottomMenu({
  active,
  onOpen,
}: {
  active: SheetId | null
  onOpen: (sheet: SheetId) => void
}): ReactNode {
  const items: { id: SheetId; icon: string; label: string }[] = [
    { id: 'jobs', icon: '📋', label: 'Jobs' },
    { id: 'station', icon: '🏠', label: 'Station' },
    { id: 'train', icon: '🚂', label: 'Train' },
  ]
  return (
    <nav className="menu" aria-label="Main menu">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className={`menu-btn ${active === it.id ? 'menu-btn-on' : ''}`}
          aria-pressed={active === it.id}
          onClick={() => onOpen(it.id)}
        >
          <span className="menu-icon" aria-hidden="true">
            {it.icon}
          </span>
          <span className="menu-label">{it.label}</span>
        </button>
      ))}
    </nav>
  )
}
