/**
 * Job replenishment keeps the cozy loop going: unlocked towns are topped up to a small target
 * number of jobs so the player always has something to haul when they return. Pure: returns a new
 * GameState. New job IDs embed `nowMs` so they never collide with existing ones.
 */
import type { GameState, Town } from '../model/types'
import { generateJobs } from './jobs'
import { makeRng } from './rng'

/** Cozy target: each unlocked town offers up to this many jobs. */
export const JOBS_TARGET = 3

/**
 * Ensure every unlocked town offers at least `target` jobs, generating fresh ones as needed.
 * Towns that already meet the target are left untouched.
 */
export function replenishJobs(
  state: GameState,
  nowMs: number,
  target: number = JOBS_TARGET,
): GameState {
  let changed = false

  const towns: Town[] = state.towns.map((town, index) => {
    if (!town.unlocked) return town
    const missing = target - town.jobs.length
    if (missing <= 0) return town

    const rng = makeRng((nowMs >>> 0) ^ (index * 0x9e3779b1))
    const fresh = generateJobs(town, state.towns, rng, missing).map((job, i) => ({
      ...job,
      id: `job-${town.id}-${nowMs}-${i}-${job.destination}-${job.kind}`,
    }))

    if (fresh.length === 0) return town
    changed = true
    return { ...town, jobs: [...town.jobs, ...fresh] }
  })

  return changed ? { ...state, towns } : state
}
