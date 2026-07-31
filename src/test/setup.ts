import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();

  get length() {
    return this.items.size;
  }

  clear() {
    this.items.clear();
  }

  getItem(key: string) {
    return this.items.get(key) ?? null;
  }

  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.items.delete(key);
  }

  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
}

// With `globals: false` (see vitest.config.ts) React Testing Library cannot
// register its own cleanup, so each test leaves mounted components behind for
// the next unless we do it here.
afterEach(cleanup);

// Node 24 exposes an unavailable experimental localStorage to Vitest. A small
// in-memory browser-compatible adapter keeps jsdom tests deterministic.
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: new MemoryStorage(),
});
