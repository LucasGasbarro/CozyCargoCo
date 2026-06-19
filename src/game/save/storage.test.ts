import { describe, it, expect, beforeEach } from 'vitest'
import { makeState } from '../engine/_fixtures'
import { localStorageSave, memorySave, SAVE_KEY } from './storage'

describe('memorySave', () => {
  it('returns null when empty and round-trips after save', () => {
    const store = memorySave()
    expect(store.load()).toBeNull()
    const s = makeState({ coins: 7 })
    store.save(s)
    expect(store.load()).toEqual(s)
    store.clear()
    expect(store.load()).toBeNull()
  })

  it('seeds from an initial state', () => {
    const s = makeState({ coins: 9 })
    expect(memorySave(s).load()).toEqual(s)
  })
})

describe('localStorageSave', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips through localStorage', () => {
    const store = localStorageSave()
    const s = makeState({ coins: 50 })
    store.save(s)
    expect(store.load()).toEqual(s)
  })

  it('loads null for a corrupt save instead of throwing', () => {
    localStorage.setItem(SAVE_KEY, '{not valid json')
    expect(localStorageSave().load()).toBeNull()
  })
})
