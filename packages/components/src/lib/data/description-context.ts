/**
 * How a {@link DescriptionRow} learns which {@link DescriptionList} it is
 * inside.
 *
 * The four list variants render their rows differently — a `grid` row is a
 * wrapper holding a stacked `<dt>`/`<dd>` pair, while a `card` row's `<dt>`
 * and `<dd>` are siblings in the list's own two-column grid, because a
 * wrapper would break the alignment the grid exists for. A call site writes
 * the same `<DescriptionRow>` either way.
 *
 * The variant travels down as context rather than as a prop so a caller
 * cannot get a list and its rows out of step, and so the list stays the
 * single place the choice is made. A row mounted with no list above it gets
 * the defaults, which is what makes one usable inside an app's own `<dl>`.
 *
 * @module
 */

import { getContext, setContext } from 'svelte';

/** The presentation a `DescriptionList` asks its rows for. */
export interface DescriptionListStyle {
  readonly variant: 'grid' | 'card' | 'divided' | 'inline';
  /** Render values in a fixed-width face that breaks anywhere. */
  readonly mono: boolean;
  /** Render a row whose value is empty, using `emptyLabel`. */
  readonly showEmpty: boolean;
  /** What an empty value reads as when `showEmpty`. */
  readonly emptyLabel: string;
}

/** The presentation a `DescriptionRow` uses outside any `DescriptionList`: the `grid` variant, proportional text, empty rows hidden. */
export const defaultDescriptionListStyle: DescriptionListStyle = {
  variant: 'grid',
  mono: false,
  showEmpty: false,
  emptyLabel: 'unrecorded',
};

const STYLE_KEY = Symbol('@thomasfosterau/components:description-list');

/** Declare the style every descendant `DescriptionRow` renders in. */
export function setDescriptionListStyle(style: () => DescriptionListStyle): void {
  setContext<() => DescriptionListStyle>(STYLE_KEY, style);
}

/** The enclosing list's style, or the defaults when there is no enclosing list. */
export function getDescriptionListStyle(): () => DescriptionListStyle {
  return (
    getContext<(() => DescriptionListStyle) | undefined>(STYLE_KEY) ??
    (() => defaultDescriptionListStyle)
  );
}
