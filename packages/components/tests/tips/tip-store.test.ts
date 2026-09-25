import { expect, test, describe } from 'vite-plus/test';
import {
  createTipStore,
  memoryTipStorage,
  type TipStorage,
} from '../../src/lib/tips/tip-store.svelte.ts';
import type { TipConfig } from '../../src/lib/tips/types.ts';

/**
 * The package's own throwaway storage, with the map it writes to exposed so a
 * test can assert what was persisted rather than only what was read back.
 */
const memoryStorage = (): TipStorage & { readonly entries: Map<string, string> } => {
  const entries = new Map<string, string>();
  const storage = memoryTipStorage();
  return {
    entries,
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => {
      entries.set(key, value);
      storage.setItem(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
      storage.removeItem(key);
    },
  };
};

const tip = (overrides: Partial<TipConfig> = {}): TipConfig => ({
  id: 'welcome',
  title: 'Welcome',
  ...overrides,
});

describe('createTipStore', () => {
  test('shows nothing for an unregistered id — a typo is an absent tip, not a rule-free one', () => {
    const store = createTipStore({ storage: memoryStorage() });
    expect(store.shouldDisplay('never-registered')).toBe(false);
  });

  test('shows a registered tip that has never been seen', () => {
    const store = createTipStore({ storage: memoryStorage() });
    store.register(tip());
    expect(store.shouldDisplay('welcome')).toBe(true);
    expect(store.getState('welcome')).toMatchObject({ status: 'pending', displayCount: 0 });
  });

  test('counts every showing', () => {
    const store = createTipStore({ storage: memoryStorage() });
    store.register(tip());
    store.markShown('welcome');
    store.markShown('welcome');
    expect(store.getState('welcome').displayCount).toBe(2);
  });

  test('stops at maxDisplayCount', () => {
    const store = createTipStore({ storage: memoryStorage() });
    store.register(tip({ maxDisplayCount: 2 }));
    store.markShown('welcome');
    expect(store.shouldDisplay('welcome')).toBe(true);
    store.markShown('welcome');
    expect(store.shouldDisplay('welcome')).toBe(false);
  });

  test('never shows a `once` tip again', () => {
    const store = createTipStore({ storage: memoryStorage() });
    store.register(tip({ frequency: 'once' }));
    store.markShown('welcome');
    expect(store.shouldDisplay('welcome')).toBe(false);
  });

  test('holds a `daily` tip until a day has passed', () => {
    const storage = memoryStorage();
    const store = createTipStore({ storage });
    store.register(tip({ frequency: 'daily' }));
    store.markShown('welcome');
    expect(store.shouldDisplay('welcome')).toBe(false);

    // Rewind the stored timestamp rather than the clock: the store reads it
    // back through `getState`, so this is the same path a later visit takes.
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    storage.setItem(
      'tips:welcome',
      JSON.stringify({
        id: 'welcome',
        status: 'available',
        displayCount: 1,
        lastShown: twoDaysAgo,
      }),
    );
    const reloaded = createTipStore({ storage });
    reloaded.register(tip({ frequency: 'daily' }));
    expect(reloaded.shouldDisplay('welcome')).toBe(true);
  });

  test('keeps dismissed and completed apart, and shows neither again', () => {
    const store = createTipStore({ storage: memoryStorage() });
    store.register(tip());
    store.dismiss('welcome');
    expect(store.getState('welcome').status).toBe('dismissed');
    expect(store.shouldDisplay('welcome')).toBe(false);

    store.register(tip({ id: 'second' }));
    store.complete('second');
    expect(store.getState('second').status).toBe('completed');
    expect(store.shouldDisplay('second')).toBe(false);
  });

  test('requires every rule to hold', () => {
    const store = createTipStore({ storage: memoryStorage() });
    store.register(
      tip({
        rules: [
          { id: 'yes', evaluate: () => true },
          { id: 'no', evaluate: () => false },
        ],
      }),
    );
    expect(store.shouldDisplay('welcome')).toBe(false);
  });

  test('treats an unreadable stored entry as never-seen rather than throwing', () => {
    const storage = memoryStorage();
    storage.setItem('tips:welcome', '{not json');
    const store = createTipStore({ storage });
    store.register(tip());
    expect(store.shouldDisplay('welcome')).toBe(true);
  });

  test('forgets everything on reset', () => {
    const storage = memoryStorage();
    const store = createTipStore({ storage });
    store.register(tip({ frequency: 'once' }));
    store.markShown('welcome');
    store.resetAll();
    expect(storage.entries.size).toBe(0);
    expect(store.shouldDisplay('welcome')).toBe(true);
  });

  test('writes under the default `tips:` prefix', () => {
    const storage = memoryStorage();
    const store = createTipStore({ storage });
    store.register(tip());
    store.markShown('welcome');
    expect(storage.entries.has('tips:welcome')).toBe(true);
  });

  test('writes under a caller-supplied prefix instead', () => {
    const storage = memoryStorage();
    const store = createTipStore({ storage, prefix: 'myapp:tips:' });
    store.register(tip());
    store.markShown('welcome');
    expect(storage.entries.has('myapp:tips:welcome')).toBe(true);
    expect(storage.entries.has('tips:welcome')).toBe(false);
  });
});
