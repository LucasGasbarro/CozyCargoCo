import { useState, type ReactNode } from 'react'
import { GameProvider } from './ui/store'
import { Hud } from './ui/Hud'
import { MapView } from './ui/MapView'
import { TownPanel } from './ui/TownPanel'
import { TrainSheet } from './ui/TrainSheet'
import { LinesSheet } from './ui/LinesSheet'
import { Sheet } from './ui/Sheet'
import { BottomMenu, type SheetId } from './ui/BottomMenu'
import { WelcomeBack } from './ui/WelcomeBack'
import { useGame } from './ui/gameContext'
import './App.css'

function App(): ReactNode {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  )
}

function Game(): ReactNode {
  const { state } = useGame()
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedSeg, setSelectedSeg] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetId | null>(null)

  const selectTown = (id: string): void => {
    setSelected(id)
    setSelectedSeg(null) // a town tap clears any line selection
    setSheet('jobs') // tapping a town opens its Jobs sheet (the loved interaction, upgraded)
  }

  const selectSegment = (segId: string): void => {
    setSelectedSeg(segId)
    setSheet('lines') // tapping a line opens the Lines sheet focused on it
  }

  const openSheet = (id: SheetId): void => {
    if (id !== 'lines') setSelectedSeg(null)
    setSheet(id)
  }

  const selectedTown = selected ? state.towns.find((t) => t.id === selected) ?? null : null

  return (
    <div className="app">
      <MapView
        selectedId={selected}
        selectedSegId={selectedSeg}
        onSelect={selectTown}
        onSelectSegment={selectSegment}
      />
      <Hud />
      <BottomMenu active={sheet} onOpen={openSheet} />

      {sheet === 'jobs' && (
        <Sheet title={selectedTown ? selectedTown.name : 'Jobs'} onClose={() => setSheet(null)}>
          {selectedTown ? (
            <TownPanel
              key={selectedTown.id}
              townId={selectedTown.id}
              onClose={() => setSheet(null)}
              hideHeader
            />
          ) : (
            <p className="panel-hint">Tap a town on the map to pick up and dispatch jobs.</p>
          )}
        </Sheet>
      )}

      {sheet === 'lines' && (
        <Sheet title="Lines" onClose={() => setSheet(null)}>
          <LinesSheet selectedSegId={selectedSeg} onSelect={setSelectedSeg} />
        </Sheet>
      )}

      {sheet === 'station' && (
        <Sheet title="Station" onClose={() => setSheet(null)}>
          <div className="empty-state">
            <span className="empty-emoji" aria-hidden="true">
              🏗️
            </span>
            <p className="panel-hint">
              Station upgrades are coming soon — nothing to manage here yet.
            </p>
          </div>
        </Sheet>
      )}

      {sheet === 'train' && (
        <Sheet title="Your trains" onClose={() => setSheet(null)}>
          <TrainSheet />
        </Sheet>
      )}

      <WelcomeBack />
    </div>
  )
}

export default App
