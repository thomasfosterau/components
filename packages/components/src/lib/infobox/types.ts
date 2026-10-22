/**
 * The shapes the `infobox` family passes around: the image spec both
 * `InfoboxImage` and an `image`-kind row accept, the row union `Infobox`'s
 * `rows` convenience renders, and the single "has something to show" rule
 * the component and its tests share.
 *
 * @module
 */

import type { Snippet } from 'svelte';

/** The picture at the top of an `Infobox`. */
export interface InfoboxImageSpec {
  readonly src: string;
  /** Empty for a purely decorative image; a description otherwise. */
  readonly alt: string;
  /** Shown beneath the picture — a photographer, a provenance, a scale. */
  readonly caption?: string | undefined;
  /** Intrinsic dimensions; supplying both is what stops the layout shifting. */
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  /**
   * Eager-loads at high `fetchpriority`. Set when this image is the page's
   * LCP candidate — typically an infobox's own identifying picture.
   */
  readonly eager?: boolean | undefined;
}

/** An `Infobox` row holding a single identifying fact (e.g. publication year, ISBN, page count). */
export interface InfoboxFactRow {
  readonly kind: 'fact';
  readonly label: string;
  /** `undefined` or an empty string skips the row. */
  readonly value: string | number | undefined;
}

/** An `Infobox` row holding a single named link, with its own visible text. */
export interface InfoboxLinkRow {
  readonly kind: 'link';
  readonly label: string;
  readonly text: string;
  /** `undefined` or an empty string skips the row. */
  readonly href: string | undefined;
  /** Passed through to the underlying `Link` — an off-site destination. */
  readonly external?: boolean | undefined;
}

/** One entry of an `InfoboxLinksRow`. */
export interface InfoboxLinkEntry {
  readonly label: string;
  readonly href: string;
}

/** An `Infobox` row for a named outbound relationship, rendered as one or more links. */
export interface InfoboxLinksRow {
  readonly kind: 'links';
  readonly label: string;
  /** `undefined` or an empty list skips the row. */
  readonly links: readonly InfoboxLinkEntry[] | undefined;
}

/**
 * An `Infobox` row for the hero/identifying image. Renders above the `<dl>` as an
 * `InfoboxImage`, not as a `dt`/`dd` pair — the same shape `Infobox`'s own
 * `image` prop takes, offered as a row for the callers who build the whole
 * infobox from one `rows` array.
 */
export interface InfoboxImageRow extends InfoboxImageSpec {
  readonly kind: 'image';
}

/** An `Infobox` row whose value is arbitrary markup (a badge, a formatted quantity). */
export interface InfoboxCustomRow {
  readonly kind: 'custom';
  readonly label: string;
  readonly content: Snippet<[]>;
}

/**
 * Discriminated union of every row kind `Infobox`'s `rows` prop accepts.
 *
 * Named `InfoboxRowSpec` rather than `InfoboxRow` (design.md's own name for
 * it) because the family already has an `InfoboxRow` COMPONENT: Svelte's
 * compiled default export carries a type meaning as well as a value one, so
 * a value export and a type export cannot share that identifier in the same
 * module without a "Duplicate identifier" error. `*Spec` matches
 * `InfoboxImageSpec`, the sibling type this union's `image` member reuses.
 */
export type InfoboxRowSpec =
  | InfoboxFactRow
  | InfoboxLinkRow
  | InfoboxLinksRow
  | InfoboxImageRow
  | InfoboxCustomRow;

/**
 * Whether a row carries renderable content — the single definition of
 * "empty" `Infobox` and its unit tests share. A `custom` row is always
 * present: its snippet is the caller's decision, not this function's.
 */
export function infoboxRowIsPresent(row: InfoboxRowSpec): boolean {
  switch (row.kind) {
    case 'fact':
      return row.value !== undefined && row.value !== '';
    case 'link':
      return row.href !== undefined && row.href !== '';
    case 'links':
      return row.links !== undefined && row.links.length > 0;
    case 'image':
      return row.src !== '';
    case 'custom':
      return true;
  }
}
