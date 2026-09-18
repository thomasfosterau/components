/**
 * Text → anchor id.
 *
 * Shared by {@link Heading} and anything else that has to address a section it
 * only knows the words of. Deliberately tiny and deterministic: the same text
 * must slug identically on the server and in the browser, or an in-page link
 * rendered during SSR points at an id hydration then changes.
 *
 * @module
 */

/**
 * Lower-case, strip anything that is not a word character, collapse runs of
 * whitespace to single hyphens.
 *
 * ```ts
 * slugify('Growing conditions & care') // 'growing-conditions-care'
 * ```
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
