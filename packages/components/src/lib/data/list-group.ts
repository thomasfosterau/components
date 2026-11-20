/**
 * How a {@link ListRow} learns it is inside a {@link ListGroup}.
 *
 * A row inside a group is a list item: it renders its own `<li>` (the
 * group's `children` are rows, and the group cannot wrap each one) and takes
 * the group's padding. Outside a group it renders only its body, so it can
 * sit in `ItemList`'s `<li>` or `<article>` (which is how `LinkListItem`
 * uses it). The group passes its variant down as context so the two cannot
 * fall out of step.
 *
 * @module
 */

import { getContext, setContext } from 'svelte';

/** How a `ListGroup` draws its rows. */
export type ListGroupVariant = 'inset' | 'plain';

/** What a `ListGroup` tells its rows. */
export interface ListGroupStyle {
  /** The group's look: an inset, rounded, bordered box, or plain dividers. */
  readonly variant: ListGroupVariant;
}

const LIST_GROUP_KEY = Symbol('@thomasfosterau/components:list-group');

/** Tell the `ListRow`s below which group they are in. */
export function setListGroupStyle(style: () => ListGroupStyle): void {
  setContext(LIST_GROUP_KEY, style);
}

/** The enclosing `ListGroup`'s style, or `undefined` for a row outside one. */
export function getListGroupStyle(): (() => ListGroupStyle) | undefined {
  return getContext<(() => ListGroupStyle) | undefined>(LIST_GROUP_KEY);
}
