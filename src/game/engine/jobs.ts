/**
 * Cargo job generation. Pure: given towns + an RNG, produce jobs available at a town.
 */
import type { CargoJob, CargoKind, Town } from '../model/types'
import { CARGO_VALUE } from '../model/types'
import { distanceUnits, jobPayout } from './economy'
import { pick, randInt, type Rng } from './rng'

const CARGO_KINDS = Object.keys(CARGO_VALUE) as CargoKind[]

let jobCounter = 0
function nextJobId(): JobIdSeed {
  jobCounter += 1
  return `job-${jobCounter}-${Math.random().toString(36).slice(2, 8)}`
}
type JobIdSeed = string

/**
 * Generate `count` jobs at `origin`, each destined for a random OTHER unlocked town.
 * Payout scales with distance and cargo value.
 */
export function generateJobs(
  origin: Town,
  allTowns: readonly Town[],
  rng: Rng,
  count: number,
): CargoJob[] {
  const destinations = allTowns.filter((t) => t.unlocked && t.id !== origin.id)
  if (destinations.length === 0) return []

  const jobs: CargoJob[] = []
  for (let i = 0; i < count; i++) {
    const dest = pick(rng, destinations)
    const kind = pick(rng, CARGO_KINDS)
    const dist = distanceUnits(origin, dest)
    jobs.push({
      id: nextJobId(),
      kind,
      destination: dest.id,
      payout: jobPayout(dist, kind),
    })
  }
  return jobs
}

/** How many jobs a town should offer (small, cozy numbers). */
export function jobsToOffer(rng: Rng): number {
  return randInt(rng, 2, 4)
}
