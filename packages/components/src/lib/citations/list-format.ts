/**
 * A small `Intl.ListFormat` helper for `CreditList`.
 *
 * `CreditList` needs to interleave real markup (a name, possibly a link)
 * between a locale's list separators ("A, B and C") — exactly what
 * `Intl.ListFormat.formatToParts` is for. This is a deliberately independent
 * implementation rather than a dependency on the `formatting/` family's
 * `FormatList`: that family is owned by a different part of this build, and
 * this is a handful of lines, not a shared abstraction worth a cross-family
 * edge for.
 *
 * @module
 */

/** One piece of a formatted list: an item from the input, or literal separator text. */
export type ListFormatPart<T> =
  | { readonly kind: 'item'; readonly value: T }
  | { readonly kind: 'separator'; readonly value: string };

export interface ListFormatOptions {
  readonly locales?: string | readonly string[] | undefined;
  readonly style?: Intl.ListFormatOptions['style'] | undefined;
  readonly type?: Intl.ListFormatOptions['type'] | undefined;
}

/**
 * Interleave `items` with the given locale's list punctuation, without
 * losing each item's identity — `formatToParts` only ever hands back
 * strings, so this maps its "element" parts back to the original items by
 * the index it was asked to format.
 */
export const formatListParts = <T>(
  items: readonly T[],
  options: ListFormatOptions = {},
): readonly ListFormatPart<T>[] => {
  const format = new Intl.ListFormat(options.locales as string | string[] | undefined, {
    style: options.style ?? 'long',
    type: options.type ?? 'conjunction',
  });
  const indices = items.map((_, index) => String(index));
  return format.formatToParts(indices).map((part) => {
    if (part.type !== 'element') return { kind: 'separator', value: part.value };
    // `formatToParts` only ever hands back the index strings this function
    // itself generated one line up, one per `items` entry — the lookup
    // cannot miss.
    const index = Number.parseInt(part.value, 10);
    const value = items[index];
    if (value === undefined) throw new Error(`formatListParts: no item at index ${index}`);
    return { kind: 'item', value };
  });
};
