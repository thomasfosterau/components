/**
 * Serialising Schema.org JSON-LD for a `<script type="application/ld+json">`
 * block.
 *
 * `JSON.stringify` already escapes `"` inside strings. What it leaves is the
 * HTML parser: an authored title containing `</script>` would close the
 * embedding script element and inject whatever follows. `<`, `>` and `&` are
 * therefore replaced with their `\u` escapes — JSON parsers read them
 * identically, so the structured-data consumer sees the original text — and so
 * are U+2028 / U+2029, which are legal in JSON strings but line terminators in
 * JavaScript (OWASP / Google's JSON-in-HTML guidance).
 *
 * @module
 */

/**
 * A JSON-LD graph node with its top-level `@context`.
 *
 * Deliberately loose: the library does not take `schema-dts` (or any
 * vocabulary) as a dependency. `WithContext<Thing>` from `schema-dts` (a type
 * alias, so it satisfies the index signature) is assignable to it, so an app
 * that type-checks its builders against the real vocabulary can hand the
 * result straight to {@link serializeJsonLd} or `<JsonLd>`.
 */
export type JsonLdObject = {
  readonly '@context': unknown;
  readonly [property: string]: unknown;
};

const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), 'g');
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), 'g');

/**
 * Serialise a JSON-LD object to a string safe to embed in a
 * `<script type="application/ld+json">` block. The output is valid JSON that
 * round-trips through `JSON.parse` to the input.
 */
export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATOR, '\\u2028')
    .replace(PARAGRAPH_SEPARATOR, '\\u2029');
}
