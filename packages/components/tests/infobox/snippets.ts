/**
 * Snippet helpers for the `infobox` suite.
 *
 * A `.ts` test has no template to declare a snippet in, and `createRawSnippet`
 * insists its fragment is a SINGLE element.
 * A snippet whose content needs real Svelte markup (a component, an event
 * handler, props to spread) cannot be built this way at all: those live as
 * fixture components under `fixtures/`.
 */

import { createRawSnippet, type Snippet } from 'svelte';

/** A snippet rendering the given HTML, which must be one element. */
export const htmlSnippet = (html: string): Snippet<[]> =>
  createRawSnippet(() => ({ render: () => html }));
