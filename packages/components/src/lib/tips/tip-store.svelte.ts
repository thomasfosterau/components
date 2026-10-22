/**
 * The tip store: which tips exist, which have been seen, and whether one may
 * show right now.
 *
 * This is a plain object with `$state` inside it, so a tip re-renders when
 * its state changes rather than when a promise resolves. Rules are
 * synchronous for the same reason a network round-trip would show a tip a
 * beat after the page did, while the reader is already doing something else:
 * await first, then declare the tip.
 *
 * Storage is optional and every access is guarded: a private window can have
 * `localStorage` present and throwing, and a tip system that breaks the page
 * it is meant to explain is worse than one that forgets.
 *
 * @module
 */

import type { TipConfig, TipState } from './types.ts';

const DEFAULT_PREFIX = 'tips:';

/**
 * The subset of the DOM `Storage` interface a tip store reads and writes, so a
 * test can pass a plain object.
 *
 * The signatures are the DOM `Storage` interface's own, `null` included: this
 * type exists so `globalThis.localStorage` satisfies it structurally.
 */
export interface TipStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

/** What `createTipStore` returns: registers tips, decides whether each may show, and records what the reader did with it. */
export interface TipStore {
  /** Declare a tip. Re-registering the same id replaces its configuration. */
  register: (config: TipConfig) => void;
  /** Whether this tip may show right now. */
  shouldDisplay: (id: string) => boolean;
  /** What is remembered about this tip. */
  getState: (id: string) => TipState;
  /** Record that it has just been shown. */
  markShown: (id: string) => void;
  /** The reader closed it: never show it again. */
  dismiss: (id: string) => void;
  /** The reader took its action: never show it again. */
  complete: (id: string) => void;
  /** Forget every tip's state — the "show me the tour again" button. */
  resetAll: () => void;
}

/** Milliseconds a frequency has to elapse before a tip may reappear. */
const INTERVALS: Readonly<Record<string, number>> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Storage that forgets when the page does.
 *
 * The fallback for a browser that refuses persistence, and the right storage
 * for a test or a Storybook story — a tip dismissed while reviewing one story
 * must not be invisible in the next reviewer's session.
 */
export const memoryTipStorage = (): TipStorage => {
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
    removeItem: (key) => {
      memory.delete(key);
    },
  };
};

/**
 * `globalThis.localStorage` where it exists and is usable, and
 * {@link memoryTipStorage} where it does not — the server, and a browser that
 * refuses storage.
 */
export const browserTipStorage = (): TipStorage => {
  try {
    const storage = globalThis.localStorage;
    // Presence is not permission: Safari's private mode throws on write.
    storage.setItem('tips:probe', '1');
    storage.removeItem('tips:probe');
    return storage;
  } catch {
    return memoryTipStorage();
  }
};

/** Options for {@link createTipStore}. */
export interface TipStoreOptions {
  /** Defaults to {@link browserTipStorage}. */
  readonly storage?: TipStorage | undefined;
  /** The storage key prefix each tip's entry is written under. */
  readonly prefix?: string | undefined;
}

/**
 * Build a tip store over the given storage.
 *
 * Call once, high in the tree, and hand it to the tips (or put it in a context
 * of the app's own). The in-memory state is what drives re-rendering; storage
 * is where it survives a reload.
 */
export const createTipStore = (options: TipStoreOptions = {}): TipStore => {
  const storage = options.storage ?? browserTipStorage();
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const configs = new Map<string, TipConfig>();
  const states = $state(new Map<string, TipState>());

  const read = (id: string): TipState => {
    const live = states.get(id);
    if (live !== undefined) return live;
    let stored: TipState = { id, status: 'pending', displayCount: 0 };
    try {
      const raw = storage.getItem(`${prefix}${id}`);
      // Trusted only for its shape: it is this app's own write, and a corrupt
      // entry falls back to "never seen" rather than throwing at the reader.
      if (raw !== null) stored = JSON.parse(raw) as TipState;
    } catch {
      /* unreadable or malformed — treat the tip as unseen */
    }
    states.set(id, stored);
    return stored;
  };

  const write = (next: TipState): void => {
    states.set(next.id, next);
    try {
      storage.setItem(`${prefix}${next.id}`, JSON.stringify(next));
    } catch {
      /* storage refused; the in-memory state still drives this session */
    }
  };

  const frequencyAllows = (config: TipConfig, state: TipState): boolean => {
    if (state.lastShown === undefined) return true;
    const frequency = config.frequency ?? 'immediate';
    if (frequency === 'immediate') return true;
    if (frequency === 'once') return false;
    const since = Date.now() - new Date(state.lastShown).getTime();
    return since >= (INTERVALS[frequency] ?? 0);
  };

  return {
    register: (config) => {
      configs.set(config.id, config);
    },

    getState: read,

    shouldDisplay: (id) => {
      const config = configs.get(id);
      // An unregistered tip shows nothing: a typo in an id should be an absent
      // tip, not a tip with no rules.
      if (config === undefined) return false;
      const state = read(id);
      if (state.status === 'dismissed' || state.status === 'completed') return false;
      if (config.maxDisplayCount !== undefined && state.displayCount >= config.maxDisplayCount) {
        return false;
      }
      if (!frequencyAllows(config, state)) return false;
      return (config.rules ?? []).every((rule) => rule.evaluate());
    },

    markShown: (id) => {
      const state = read(id);
      write({
        ...state,
        status: 'available',
        displayCount: state.displayCount + 1,
        lastShown: new Date().toISOString(),
      });
    },

    dismiss: (id) => {
      write({ ...read(id), status: 'dismissed', dismissedAt: new Date().toISOString() });
    },

    complete: (id) => {
      write({ ...read(id), status: 'completed', completedAt: new Date().toISOString() });
    },

    resetAll: () => {
      for (const id of [...states.keys(), ...configs.keys()]) {
        states.delete(id);
        try {
          storage.removeItem(`${prefix}${id}`);
        } catch {
          /* storage refused; the in-memory reset still stands */
        }
      }
    },
  };
};
