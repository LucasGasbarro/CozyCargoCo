import { useState, type ReactNode } from 'react'
import { GameProvider } from './ui/store'
import { Hud } from './ui/Hud'
import { MapView } from './ui/MapView'
import { TownPanel } from './ui/TownPanel'
import { Roster } from './ui/Roster'
import { WelcomeBack } from './ui/WelcomeBack'
import './App.css'

function App(): ReactNode {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <GameProvider>
      <div className="app">
        <Hud />
        <main className="stage">
          <MapView selectedId={selected} onSelect={setSelected} />
        </main>
        <div className="dock">
          {selected ? (
            <TownPanel key={selected} townId={selected} onClose={() => setSelected(null)} />
          ) : (
            <p className="panel-hint dock-hint">Tap a town on the map to manage its trains.</p>
          )}
          <Roster onSelectTown={setSelected} />
        </div>
        <WelcomeBack />
      </div>
    </GameProvider>
  )
}

export default App
