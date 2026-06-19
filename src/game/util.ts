/**
 * Small, pure utility helpers shared across the game logic.
 * Kept framework-agnostic and fully unit-testable (BasePrompt §13).
 */

/** Clamp a number into the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) throw new Error('clamp: min must be <= max')
  return Math.min(Math.max(value, min), max)
}

/** Format a coin amount for display, e.g. 1234 -> "1,234". */
export function formatCoins(amount: number): string {
  return Math.round(amount).toLocaleString('en-US')
}
