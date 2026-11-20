/**
 * `MaskedInput`'s arithmetic: strip typed or pasted text to its raw
 * characters, format raw text with a pattern, and map the caret between
 * the two. Pure, so each is tested without a browser.
 *
 * A pattern's `9` takes a digit, `a` a letter and `*` either; any other
 * character is a literal, shown only once a raw character follows it.
 *
 * @module
 */

/** A pattern, or a function choosing one from the raw text so far (a card's brand). */
export type Mask = string | ((raw: string) => string);

/** A ready-made mask with the input hints that suit it. */
export interface MaskPreset {
  readonly mask: Mask;
  readonly inputmode?: 'numeric' | 'text' | 'tel' | undefined;
  readonly autocomplete?: string | undefined;
  /** Rewrites the stripped characters before they fill the pattern (a country code to a leading 0). */
  readonly normalise?: ((loose: string) => string) | undefined;
}

const slotPattern: Record<string, RegExp> = {
  '9': /^\d$/u,
  a: /^\p{L}$/u,
  '*': /^[\p{L}\d]$/u,
};

/** Whether this pattern character is a slot rather than a literal. */
export const isSlot = (token: string): boolean => slotPattern[token] !== undefined;

const accepts = (token: string, char: string): boolean => slotPattern[token]?.test(char) === true;

/** The pattern a mask gives for this raw text. */
export const patternFor = (mask: Mask, raw: string): string =>
  typeof mask === 'string' ? mask : mask(raw);

/** Letters and digits only: what a dynamic mask chooses its pattern from. */
const loose = (text: string): string => text.replaceAll(/[^\p{L}\d]/gu, '');

/**
 * The raw characters of `text` under `mask`: each character the next slot
 * accepts, in order, with literals, rejected characters and anything past
 * the last slot dropped.
 */
export const toRaw = (text: string, mask: Mask, normalise?: (loose: string) => string): string => {
  const source = normalise === undefined ? text : normalise(loose(text));
  const pattern = patternFor(mask, loose(source));
  const slots = Array.from(pattern).filter((token) => isSlot(token));
  let raw = '';
  for (const char of source) {
    const slot = slots[raw.length];
    if (slot === undefined) break;
    if (accepts(slot, char)) raw += char;
  }
  return raw;
};

/** `raw` laid into its pattern; a literal appears only once a raw character follows it. */
export const format = (raw: string, mask: Mask): string => {
  const pattern = patternFor(mask, raw);
  const chars = Array.from(raw);
  let out = '';
  let used = 0;
  let pending = '';
  for (const token of pattern) {
    if (used >= chars.length) break;
    if (isSlot(token)) {
      out += pending + (chars[used] ?? '');
      pending = '';
      used += 1;
    } else {
      pending += token;
    }
  }
  return out;
};

/** How many raw characters sit before `caret` in `text`. */
export const rawBefore = (text: string, caret: number, mask: Mask): number =>
  toRaw(text.slice(0, caret), mask).length;

/** Where the caret goes in `formatted` to sit just after `count` raw characters. */
export const caretAfter = (formatted: string, count: number, mask: Mask): number => {
  if (count <= 0) return 0;
  const pattern = patternFor(mask, toRaw(formatted, mask));
  let seen = 0;
  for (const [index, token] of Array.from(pattern).entries()) {
    if (index >= formatted.length) break;
    if (isSlot(token)) seen += 1;
    if (seen === count) return index + 1;
  }
  return formatted.length;
};

/** The raw text and caret after an edit. */
export interface MaskEdit {
  readonly raw: string;
  readonly caret: number;
}

/**
 * Backspace or Delete with the caret against literals: removes the raw
 * character beyond them, so a separator never traps the caret. `undefined`
 * when the character being deleted is not a literal (the browser's own
 * deletion is right then).
 */
export const deleteAcrossLiteral = (
  formatted: string,
  caret: number,
  direction: 'backward' | 'forward',
  mask: Mask,
): MaskEdit | undefined => {
  const pattern = patternFor(mask, toRaw(formatted, mask));
  const neighbour = direction === 'backward' ? caret - 1 : caret;
  const token = pattern[neighbour];
  if (token === undefined || isSlot(token) || neighbour >= formatted.length) return undefined;
  const raw = toRaw(formatted, mask);
  const before = rawBefore(formatted, caret, mask);
  const removeAt = direction === 'backward' ? before - 1 : before;
  if (removeAt < 0 || removeAt >= raw.length) return undefined;
  const next = raw.slice(0, removeAt) + raw.slice(removeAt + 1);
  return { raw: next, caret: caretAfter(format(next, mask), removeAt, mask) };
};

/** The kind of character a pattern's slots take, for the "rejected" message. */
export const slotKind = (pattern: string): 'digits' | 'letters' | 'mixed' => {
  const slots = new Set(Array.from(pattern).filter((token) => isSlot(token)));
  if (slots.size === 1 && slots.has('9')) return 'digits';
  if (slots.size === 1 && slots.has('a')) return 'letters';
  return 'mixed';
};

/** A card's brand from its leading digits, for the brands with their own grouping. */
export const cardBrand = (raw: string): 'amex' | 'visa' | 'mastercard' | 'other' => {
  if (/^3[47]/u.test(raw)) return 'amex';
  if (raw.startsWith('4')) return 'visa';
  if (/^(5[1-5]|2[2-7])/u.test(raw)) return 'mastercard';
  return 'other';
};

/** Whether a card number passes the Luhn checksum. */
export const luhnValid = (raw: string): boolean => {
  if (!/^\d{12,19}$/u.test(raw)) return false;
  let sum = 0;
  for (const [offset, char] of Array.from(raw).toReversed().entries()) {
    const digit = Number(char);
    const doubled = offset % 2 === 1 ? digit * 2 : digit;
    sum += doubled > 9 ? doubled - 9 : doubled;
  }
  return sum % 10 === 0;
};

/** Common Australian and international formats, as data. */
export const maskPresets = {
  /** An Australian mobile, `0412 345 678`; a pasted `+61` becomes the leading 0. */
  auMobile: {
    mask: '9999 999 999',
    inputmode: 'numeric',
    autocomplete: 'tel-national',
    normalise: (digits) => (/^61[45]\d{8}$/u.test(digits) ? `0${digits.slice(2)}` : digits),
  },
  /** An Australian postcode, `2000`. */
  auPostcode: { mask: '9999', inputmode: 'numeric', autocomplete: 'postal-code' },
  /** A card number grouped by brand: Amex 4-6-5, others 4-4-4-4 (up to 19 digits). */
  card: {
    mask: (raw) => (cardBrand(raw) === 'amex' ? '9999 999999 99999' : '9999 9999 9999 9999 999'),
    inputmode: 'numeric',
    autocomplete: 'cc-number',
  },
  /** An ISO date, `2026-11-20`. */
  isoDate: { mask: '9999-99-99', inputmode: 'numeric' },
} satisfies Record<string, MaskPreset>;
