/**
 * Initials for an `Avatar`'s fallback.
 *
 * @module
 */

/** The first grapheme of `word`, so an accent, an emoji or a combining mark is never cut in half. */
const firstGrapheme = (word: string): string => {
  if (typeof Intl.Segmenter === 'function') {
    for (const { segment } of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(
      word,
    )) {
      return segment;
    }
    return '';
  }
  // Without `Intl.Segmenter`, at least never split a surrogate pair.
  const point = word.codePointAt(0);
  return point === undefined ? '' : String.fromCodePoint(point);
};

/**
 * Initials from a name: the first grapheme of its first and last words,
 * upper-cased ("Ada King Lovelace" → "AL", "Émile Zola" → "ÉZ", "Ada" → "A").
 */
export function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(/\s+/u)
    .filter((word) => word !== '');
  const first = words[0];
  if (first === undefined) return '';
  const last = words.length > 1 ? words.at(-1) : undefined;
  return [first, last]
    .filter((word): word is string => word !== undefined)
    .map((word) => firstGrapheme(word).toLocaleUpperCase())
    .join('');
}
