/**
 * The row and section shapes the command palette renders.
 *
 * A {@link CommandItem} is deliberately not a `CommandAction`: registry
 * actions always run something, whereas a palette row can just as well be a
 * search result that navigates, or a row whose whole behaviour is the
 * caller's `onSelect`. The palette projects registry actions into this shape
 * internally, so one row renderer serves both sources.
 *
 * @module
 */

/** One row of the command palette: an id, a label, the group it sits in, and what activating it does. */
export interface CommandItem {
  /** Stable id. Unique within its group; it is what bits-ui ranks and selects on. */
  id: string;
  /** The row's text — what the reader searches for and what is announced. */
  label: string;
  /** Which {@link CommandGroup} the row belongs in, by `id`. */
  group: string;
  /** Muted trailing text: a path, a date, a parent name. */
  hint?: string | undefined;
  /** A short chip on the right — a type, a status. */
  badge?: string | undefined;
  /** What activating the row does. Runs after the palette closes. */
  run?: (() => void | Promise<void>) | undefined;
  /** Where activating the row goes. Resolved through the components context. */
  href?: string | undefined;
}

/** A palette section: an id rows point at, and the heading it renders. */
export interface CommandGroup {
  /** What a `CommandItem`'s `group` names. */
  id: string;
  /** The section heading. */
  label: string;
}

/**
 * The sections a palette shows when given none: the two group ids the hotkey
 * registry uses (`actions`, `navigation`), then whatever `onSearch` returns.
 */
export const defaultCommandGroups: readonly CommandGroup[] = [
  { id: 'actions', label: 'Actions' },
  { id: 'navigation', label: 'Go to' },
  { id: 'results', label: 'Results' },
];
