/**
 * Cozy Cargo Co. starter world (BasePrompt §10 invented world, §8 MVP content scale:
 * ~8 towns, 2–3 trains, coins only, 4–6 cargo types).
 *
 * createNewGame() seeds a fresh, connected starter network with jobs ready to haul.
 */
import {
  SAVE_VERSION,
  type CargoKind,
  type GameState,
  type Town,
  type TownId,
  type TrackSegment,
  type Train,
} from '../model/types'
import { distanceUnits } from '../engine/economy'
import { generateJobs, jobsToOffer } from '../engine/jobs'
import { makeRng } from '../engine/rng'

/** Friendly labels for cargo kinds (UI display). */
export const CARGO_LABEL: Record<CargoKind, string> = {
  passengers: 'Passengers',
  mail: 'Mail',
  produce: 'Produce',
  livestock: 'Livestock',
  timber: 'Timber',
  machinery: 'Machinery',
}

/** Coins the player starts a new game with. */
export const STARTING_COINS = 75

interface TownSeed {
  id: TownId
  name: string
  x: number
  y: number
  unlocked: boolean
}

/** Eight cozy towns laid out across a little island (world units ~0..1000). */
const TOWN_SEEDS: TownSeed[] = [
  { id: 'ashford', name: 'Ashford', x: 200, y: 500, unlocked: true },
  { id: 'brook', name: 'Brookwell', x: 400, y: 300, unlocked: true },
  { id: 'cedar', name: 'Cedar Hollow', x: 450, y: 660, unlocked: true },
  { id: 'dewbury', name: 'Dewbury', x: 660, y: 460, unlocked: true },
  { id: 'mossy', name: 'Mossy Vale', x: 130, y: 250, unlocked: false },
  { id: 'elder', name: 'Elderpine', x: 830, y: 250, unlocked: false },
  { id: 'fox', name: 'Foxglen', x: 840, y: 660, unlocked: false },
  { id: 'gull', name: 'Gull Harbour', x: 980, y: 470, unlocked: false },
]

/** Track connections present at the start of a new game (among the unlocked towns). */
const STARTER_TRACK: [TownId, TownId][] = [
  ['ashford', 'brook'],
  ['ashford', 'cedar'],
  ['brook', 'dewbury'],
  ['cedar', 'dewbury'],
]

interface TrainSeed {
  id: string
  name: string
  kind: Train['kind']
  speedUnitsPerMs: number
  carSlots: number
  startTown: TownId
}

/** Two gentle starter locomotives, both parked at Ashford. */
const TRAIN_SEEDS: TrainSeed[] = [
  {
    id: 'puffer',
    name: 'Little Puffer',
    kind: 'steam',
    speedUnitsPerMs: 0.0016,
    carSlots: 2,
    startTown: 'ashford',
  },
  {
    id: 'hopper',
    name: 'Meadow Hopper',
    kind: 'diesel',
    speedUnitsPerMs: 0.0024,
    carSlots: 3,
    startTown: 'ashford',
  },
]

function buildTrack(towns: Town[]): TrackSegment[] {
  const byId = new Map(towns.map((t) => [t.id, t]))
  return STARTER_TRACK.map(([a, b]) => {
    const ta = byId.get(a)
    const tb = byId.get(b)
    if (!ta || !tb) throw new Error(`buildTrack: unknown town in segment ${a}-${b}`)
    return { a, b, lengthUnits: Math.round(distanceUnits(ta, tb)) }
  })
}

/**
 * Create a fresh game seeded at `nowMs`. Jobs are generated deterministically from `seed` so the
 * same seed always yields the same opening hand (handy for tests).
 */
export function createNewGame(nowMs: number, seed: number = nowMs >>> 0): GameState {
  const rng = makeRng(seed)

  const towns: Town[] = TOWN_SEEDS.map((s) => ({
    id: s.id,
    name: s.name,
    x: s.x,
    y: s.y,
    unlocked: s.unlocked,
    jobs: [],
  }))

  // Seed jobs at each unlocked town, destined for other unlocked towns.
  for (const town of towns) {
    if (!town.unlocked) continue
    town.jobs = generateJobs(town, towns, rng, jobsToOffer(rng))
  }

  const track = buildTrack(towns)

  const trains: Train[] = TRAIN_SEEDS.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind,
    speedUnitsPerMs: s.speedUnitsPerMs,
    carSlots: s.carSlots,
    cars: [],
    location: { type: 'at-town', town: s.startTown },
  }))

  return {
    version: SAVE_VERSION,
    coins: STARTING_COINS,
    towns,
    track,
    trains,
    lastSeenMs: nowMs,
  }
}
