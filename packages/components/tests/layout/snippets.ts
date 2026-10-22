/**
 * Snippet helpers for the `layout` suite.
 *
 * A `.ts` test has no template to declare a snippet in, and `createRawSnippet`
 * insists its fragment is a SINGLE element.
 * Anything needing real Svelte markup (a child component, a parameterised
 * snippet, a binding) lives as a fixture under `fixtures/` instead.
 */

import { createRawSnippet, type Snippet } from 'svelte';

/** A snippet rendering the given HTML, which must be one element. */
export const htmlSnippet = (html: string): Snippet<[]> =>
  createRawSnippet(() => ({ render: () => html }));
