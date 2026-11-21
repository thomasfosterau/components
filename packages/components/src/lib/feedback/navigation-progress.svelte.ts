/**
 * The navigation-progress seam: a per-app store that `NavigationProgress`
 * draws, published through context rather than held in a module-level
 * singleton, so two apps (or two tests) on a page never share one.
 *
 * @module
 */

import { getContext, setContext } from 'svelte';

/** What `getNavigationProgress()` returns: the controls for the top-of-page bar. */
export interface NavigationProgressApi {
  /** Begin an operation. Calls are counted, so the bar completes only when every one is done. */
  start(): void;
  /** Report real progress, from 0 to 1 (an upload's bytes); starts the bar if it is idle. */
  set(fraction: number): void;
  /** Add to the reported progress. @defaultValue `0.1` for `by` */
  increment(by?: number): void;
  /** Finish one operation; the bar completes and fades when none are left. */
  done(): void;
  /** Whether any operation is in flight. */
  readonly active: boolean;
  /** The reported progress from `set` or `increment`, or `undefined` while it is unknown. */
  readonly value: number | undefined;
}

const clamp = (fraction: number): number =>
  Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;

class NavigationProgressStore implements NavigationProgressApi {
  #pending = $state(0);
  #value: number | undefined = $state(undefined);

  get active(): boolean {
    return this.#pending > 0;
  }

  get value(): number | undefined {
    return this.#value;
  }

  start(): void {
    if (this.#pending === 0) this.#value = undefined;
    this.#pending += 1;
  }

  set(fraction: number): void {
    if (this.#pending === 0) this.#pending = 1;
    this.#value = clamp(fraction);
  }

  increment(by = 0.1): void {
    this.set((this.#value ?? 0) + by);
  }

  done(): void {
    this.#pending = Math.max(0, this.#pending - 1);
  }
}

/** A fresh store, for `setNavigationProgress` or a `NavigationProgress`'s `progress` prop. */
export const createNavigationProgress = (): NavigationProgressApi => new NavigationProgressStore();

const NAVIGATION_PROGRESS_KEY = Symbol('@thomasfosterau/components:navigation-progress');

/**
 * Publish a store to the component tree below (a fresh one unless given)
 * and return it. Call once, in the root layout.
 */
export function setNavigationProgress(
  api: NavigationProgressApi = createNavigationProgress(),
): NavigationProgressApi {
  return setContext(NAVIGATION_PROGRESS_KEY, api);
}

/** The store `setNavigationProgress` published. Throws when there is none. */
export function getNavigationProgress(): NavigationProgressApi {
  const api = getContext<NavigationProgressApi | undefined>(NAVIGATION_PROGRESS_KEY);
  if (api === undefined) {
    throw new Error('getNavigationProgress() was called before setNavigationProgress()');
  }
  return api;
}
