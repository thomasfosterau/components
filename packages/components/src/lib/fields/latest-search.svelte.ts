/**
 * The search lifecycle `Combobox` and `TagsInput` share: debounce,
 * latest-wins and stale-while-revalidate.
 *
 *   debounce        a keystroke does not start a request; `debounceMs` of
 *                   quiet does.
 *   latest-wins     each request gets an `AbortController`, and starting a
 *                   new one aborts the last, so a slow first response cannot
 *                   overwrite a fast second one.
 *   stale-while-    `results` keeps the previous answer while the next is in
 *     revalidate    flight, with `pending` true, so a dropdown does not
 *                   strobe on every keystroke.
 *
 * Reactive (`$state`) so a component reads `results`, `pending` and `error`
 * straight into its template. Call `dispose()` from an `$effect` teardown.
 *
 * @module
 */

/** An asynchronous search: `signal` aborts when a newer query supersedes this one. */
export type SearchFn<T> = (query: string, signal: AbortSignal) => Promise<readonly T[]>;

/** Debounced, latest-wins search state for one input. */
export class LatestSearch<T> {
  /** What the last settled search returned. */
  results = $state<readonly T[]>([]);
  /** A search is scheduled or in flight. */
  pending = $state(false);
  /** The last search's failure message, if it failed. */
  error = $state<string | undefined>();

  #search: () => SearchFn<T> | undefined;
  #debounceMs: () => number;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #inFlight: AbortController | undefined;

  /** Getters, so the component's current props are read at call time. */
  constructor(search: () => SearchFn<T> | undefined, debounceMs: () => number) {
    this.#search = search;
    this.#debounceMs = debounceMs;
  }

  /** Search for `query` after the debounce, superseding anything earlier. */
  schedule(query: string): void {
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      this.#run(query);
    }, this.#debounceMs());
  }

  /** Cancel anything scheduled or in flight and empty the results. */
  clear(): void {
    this.dispose();
    this.#inFlight = undefined;
    this.pending = false;
    this.results = [];
  }

  /** Cancel anything scheduled or in flight; for an `$effect` teardown. */
  dispose(): void {
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#inFlight?.abort();
  }

  #run(query: string): void {
    const search = this.#search();
    if (search === undefined) return;
    this.#inFlight?.abort();
    const own = new AbortController();
    this.#inFlight = own;
    this.pending = true;
    this.error = undefined;
    // A superseded request must not write: `#inFlight` is the identity check,
    // `signal.aborted` catches the caller aborting its own work.
    const current = (): boolean => !own.signal.aborted && this.#inFlight === own;
    void search(query, own.signal)
      .then((next) => {
        if (!current()) return;
        this.results = next;
        this.pending = false;
      })
      .catch((error: unknown) => {
        if (!current()) return;
        this.pending = false;
        this.error = error instanceof Error ? error.message : String(error);
      });
  }
}
