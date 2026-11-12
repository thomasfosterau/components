/**
 * Narrowing for DOM lookups in tests.
 *
 * `locator.element()` is typed `HTMLElement | SVGElement` and `querySelector`
 * returns `Element`; a test that needs `.focus()`, `.value` or `.click()` must
 * prove the element is what it expects, and an `as` cast would not prove it.
 *
 * @module tests/dom
 */

/** `value` as an instance of `type`; throws, naming `type`, when it is not. */
export function instanceOf<T>(value: unknown, type: abstract new (...args: never[]) => T): T {
  if (!(value instanceof type)) throw new Error(`expected an instance of ${type.name}`);
  return value;
}
