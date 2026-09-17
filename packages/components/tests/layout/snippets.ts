/**
 * Snippet helpers for the `layout` suite.
 *
 * A `.ts` test has no template to declare a snippet in, and `createRawSnippet`
 * insists its fragment is a SINGLE element — so bare text has to be wrapped.
 * Anything needing real Svelte markup (a child component, a parameterised
 * snippet, a binding) lives as a fixture under `fixtures/` instead.
 */

import { createRawSnippet, type Snippet } from 'svelte';

/** A snippet rendering `content` inside a `<span>`. */
export const textSnippet = (content: string): Snippet<[]> =>
  createRawSnippet(() => ({ render: () => `<span>${content}</span>` }));

/** A snippet rendering the given HTML, which must be one element. */
export const htmlSnippet = (html: string): Snippet<[]> =>
  createRawSnippet(() => ({ render: () => html }));
