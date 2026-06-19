/**
 * Core domain types for Cozy Cargo Co. (BasePrompt §13).
 *
 * Design notes:
 * - Time is ALWAYS timestamp-based (epoch ms), never frame counts, so progress survives the
 *   tab being closed and offline reconciliation is exact.
 * - This module is pure data + types; no React, no DOM, no side effects.
 */

export type TownId = string
export type TrainId = string
export type JobId = string

/** Kinds of cargo that can be hauled. Relative value feeds the payout formula. */
export type CargoKind = 'passengers' | 'mail' | 'produce' | 'timber' | 'machinery' | 'livestock'

export type TrainKind = 'steam' | 'diesel' | 'electric'

/** A town/station node on the map. */
export interface Town {
  id: TownId
  name: string
  /** Map coordinates in abstract world units. */
  x: number
  y: number
  unlocked: boolean
  /** Jobs currently available to pick up at this town. */
  jobs: CargoJob[]
}

/** A bidirectional track connection between two towns. */
export interface TrackSegment {
  a: TownId
  b: TownId
  /** Distance in world units (derived from town coordinates when built). */
  lengthUnits: number
}

/** A delivery job: haul `kind` cargo to `destination` for `payout` coins. */
export interface CargoJob {
  id: JobId
  kind: CargoKind
  /** Where this cargo wants to go. */
  destination: TownId
  /** Coin reward on delivery. */
  payout: number
}

/** A train sitting idle at a town. */
export interface AtTown {
  type: 'at-town'
  town: TownId
}

/** A train travelling between two towns over a real-time window. */
export interface EnRoute {
  type: 'en-route'
  from: TownId
  to: TownId
  departAtMs: number
  arriveAtMs: number
}

export type TrainLocation = AtTown | EnRoute

/** A locomotive the player dispatches. */
export interface Train {
  id: TrainId
  name: string
  kind: TrainKind
  /** World units travelled per millisecond (higher = faster). */
  speedUnitsPerMs: number
  /** Number of cargo slots. */
  carSlots: number
  /** Cargo currently loaded (length <= carSlots). */
  cars: CargoJob[]
  location: TrainLocation
}

/** The full, serializable game state. */
export interface GameState {
  /** Save schema version for future migrations. */
  version: number
  coins: number
  towns: Town[]
  track: TrackSegment[]
  trains: Train[]
  /** Epoch ms of the last time state was advanced/seen (drives offline progress). */
  lastSeenMs: number
}

/** Current save schema version. Bump when the shape of GameState changes. */
export const SAVE_VERSION = 1

/** Relative value multiplier per cargo kind, used by the payout formula. */
export const CARGO_VALUE: Record<CargoKind, number> = {
  passengers: 1.0,
  mail: 1.1,
  produce: 1.2,
  livestock: 1.4,
  timber: 1.6,
  machinery: 2.0,
}
