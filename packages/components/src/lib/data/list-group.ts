/**
 * Tells a `ListRow` it is inside a `ListGroup`: it then renders its own
 * `<li>` and takes the group's padding; outside one it renders only its body.
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
