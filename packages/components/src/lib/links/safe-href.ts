/** Schemes a caller-supplied URL may use; anything else (`javascript:`, `data:`, `vbscript:`) is dropped. */
const SAFE_SCHEMES: ReadonlySet<string> = new Set(['http', 'https', 'mailto', 'tel']);

/** A URL scheme as the URL parser reads one: a letter, then letters, digits, `+`, `-` or `.`, then `:`. */
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/**
 * `value`, cleaned the way a browser cleans an `href`, when it is safe to
 * render from caller data; `undefined` otherwise.
 *
 * Safe means relative (`/books/1`, `./a`, `../a`, `books/1`, `?q`, `#id`,
 * `//host/a`) or one of `http:`, `https:`, `mailto:` and `tel:`. The
 * browser strips leading and trailing control characters and spaces and
 * drops tabs and newlines anywhere before it reads the scheme, so this does
 * too: `" \tJaVaScRiPt:alert(1)"` is still `javascript:`.
 */
export function safeHref(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  // oxlint-disable-next-line no-control-regex -- these are the characters the URL parser strips.
  const cleaned = value.replaceAll(/[\t\n\r]/g, '').replaceAll(/^[\u0000- ]+|[\u0000- ]+$/g, '');
  const scheme = SCHEME.exec(cleaned)?.[1];
  return scheme === undefined || SAFE_SCHEMES.has(scheme.toLowerCase()) ? cleaned : undefined;
}
