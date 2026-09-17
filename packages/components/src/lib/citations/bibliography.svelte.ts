/**
 * The bibliography context a page's citations and footnotes collect into.
 *
 * A `<Citation>` in prose has to know its own number, and the number depends
 * on how many distinct sources were cited before it — which only the
 * surrounding page knows. So the four components share one manager through
 * Svelte context: `<Citation>` registers a source and gets its ordinal back,
 * `<ReferenceList>` renders what accumulated, and the footnote pair does the
 * same for notes.
 *
 * `getBibliographyContext` does not throw when no provider is mounted: it
 * falls back to a fresh manager, matching how this package's
 * `setComponentsContext` degrades (`../context.svelte.ts`). A `<Citation>`
 * rendered on its own — in a story, in a unit test, or on a page that never
 * calls `setupBibliography` — is a legitimate use; it just numbers from one
 * and has no reference list to link to.
 *
 * @module
 */

import { getContext, setContext } from 'svelte';
import type { Citation, Footnote } from './citation.ts';

const BIBLIOGRAPHY_KEY = Symbol('components/bibliography');

/** One collected source, with the order it was first cited in. */
export interface BibliographyEntry {
  readonly citation: Citation;
  readonly order: number;
}

/**
 * The per-page collector. Citations dedupe by id — the same source cited
 * three times is `[1]` three times, which is the whole point of a numbered
 * style — and footnotes dedupe by their own key.
 */
export class BibliographyManager {
  #entries = $state(new Map<string, BibliographyEntry>());
  #footnotes = $state(new Map<string, Footnote>());
  #nextOrder = $state(1);

  /**
   * Register a source and return its bibliography number, assigning the next
   * one if this is its first appearance.
   */
  addCitation(citation: Citation): number {
    const existing = this.#entries.get(citation.id);
    if (existing !== undefined) return existing.order;
    const order = this.#nextOrder;
    this.#entries.set(citation.id, { citation, order });
    this.#nextOrder = order + 1;
    return order;
  }

  /** Every collected source, in citation order. */
  citations(): readonly BibliographyEntry[] {
    return [...this.#entries.values()].sort((a, b) => a.order - b.order);
  }

  /** Register a footnote under a caller-supplied key. */
  addFootnote(id: string, footnote: Footnote): void {
    this.#footnotes.set(id, footnote);
  }

  /** Every collected footnote, in registration order. */
  footnotes(): readonly (readonly [string, Footnote])[] {
    return [...this.#footnotes.entries()];
  }
}

/**
 * Provide a bibliography to a component subtree. Call once, in the page (or
 * layout) whose prose carries the citations.
 */
export const setupBibliography = (): BibliographyManager => {
  const manager = new BibliographyManager();
  setContext(BIBLIOGRAPHY_KEY, manager);
  return manager;
};

/**
 * The nearest provided bibliography, or a fresh standalone one.
 *
 * Falling back rather than throwing is deliberate (see the module doc).
 */
export const getBibliographyContext = (): BibliographyManager => {
  // `getContext<T>` is typed to return `T`, but returns `undefined` when no
  // provider is mounted — the `??` is the runtime fallback that type does not
  // describe, which is why the annotation stays `BibliographyManager` rather
  // than widening the whole call site to a union.
  const provided = getContext<BibliographyManager>(BIBLIOGRAPHY_KEY);
  return provided ?? new BibliographyManager();
};
