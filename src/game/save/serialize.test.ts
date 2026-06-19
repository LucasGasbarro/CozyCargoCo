import { describe, it, expect } from 'vitest'
import { makeState } from '../engine/_fixtures'
import { serialize, deserialize } from './serialize'

describe('serialize/deserialize', () => {
  it('round-trips a game state', () => {
    const s = makeState({ coins: 123 })
    expect(deserialize(serialize(s))).toEqual(s)
  })

  it('throws on a non-object', () => {
    expect(() => deserialize('42')).toThrow()
  })

  it('throws on an unsupported version', () => {
    expect(() => deserialize(JSON.stringify({ ...makeState(), version: 999 }))).toThrow()
  })

  it('throws on missing required fields', () => {
    expect(() => deserialize(JSON.stringify({ version: 1 }))).toThrow()
  })
})
