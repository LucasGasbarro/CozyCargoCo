/** Tiny display formatters for the UI layer. */

/** Human-friendly short duration, e.g. 83000 -> "1m 23s", 9000 -> "9s". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  if (m <= 0) return `${s}s`
  return `${m}m ${s.toString().padStart(2, '0')}s`
}
