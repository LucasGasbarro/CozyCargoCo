/**
 * Test setup: this jsdom build ships a non-functional `localStorage` (an empty object),
 * so we install a small Map-backed polyfill for save-layer tests.
 */
class MemoryStorage {
  private store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null
  }
  setItem(key: string, value: string): void {
    this.store.set(String(key), String(value))
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
}

const hasWorkingStorage =
  typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function'

if (!hasWorkingStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage() as unknown as Storage,
    writable: true,
    configurable: true,
  })
}
