/**
 * The row shape an index page maps its data into before handing it to
 * `ItemList`.
 *
 * A type, not a resource: the caller's own mappers turn a wire document into
 * it, which is what keeps every API's shape out of this package. It lives in
 * a `.ts` module rather than a `<script module>` block so a mapper — and the
 * mapper's unit test — can import it without reaching through a component.
 *
 * Both optional members are declared `?: T | undefined` rather than bare
 * `?: T`. The workspace compiles under `exactOptionalPropertyTypes`, where
 * `{ subtitle: undefined }` is not the same thing as an absent key: with the
 * narrow declaration every mapper reading a possibly-absent attribute has to
 * spread the member conditionally, which is three lines and a comment at
 * every call site. Widening it here is what removes them.
 *
 * @module
 */

/** One row of a `LinkListItem`-shaped list. */
export interface LinkListItemData {
  /** Stable identity — the list's `{#each}` key. */
  readonly id: string;
  /** Where the row's title links to; resolved through the components context. */
  readonly href: string;
  readonly title: string;
  /** A line of context under the title — an owner, a parent, a date. */
  readonly subtitle?: string | undefined;
  /** Short markers rendered as badges (a visibility state, a kind). */
  readonly badges?: readonly string[] | undefined;
}
