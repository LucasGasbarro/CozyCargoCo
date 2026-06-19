import { describe, it, expect } from 'vitest'
import { clamp, formatCoins } from './util'

describe('clamp', () => {
  it('keeps values inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps below min and above max', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })

  it('throws when min > max', () => {
    expect(() => clamp(1, 10, 0)).toThrow()
  })
})

describe('formatCoins', () => {
  it('adds thousands separators', () => {
    expect(formatCoins(1234)).toBe('1,234')
    expect(formatCoins(0)).toBe('0')
  })
})
