/**
 * The arithmetic behind `KanbanBoard`: finding a card, moving it within or
 * between columns, work-in-progress limits and the English announcements.
 * It builds on `SortableList`'s `move` and adds a second dimension.
 *
 * @module
 */

import { move } from './sortable.ts';

/** One column of a board: its cards in order and an optional work-in-progress limit. */
export interface BoardColumn<C> {
  readonly id: string;
  readonly title: string;
  readonly cards: readonly C[];
  /** The most cards the column should hold. */
  readonly limit?: number | undefined;
}

/** Where a card sits: a column index and a card index within it. */
export interface BoardPlace {
  readonly column: number;
  readonly index: number;
}

/** The board's live-region messages. Positions are 1-based; `total` is the column's length. */
export interface BoardAnnouncements {
  /** A card was picked up. */
  readonly pickedUp: (name: string, column: string, position: number, total: number) => string;
  /** A held card moved within its column. */
  readonly movedWithin: (name: string, position: number, total: number) => string;
  /** A card moved to another column (held, or through the menu). */
  readonly movedTo: (name: string, column: string, position: number, total: number) => string;
  /** A held card was put down. */
  readonly dropped: (name: string, column: string, position: number, total: number) => string;
  /** A held card went back where it was picked up (Escape). */
  readonly cancelled: (name: string, column: string, position: number) => string;
  /** A move into a full column was refused. */
  readonly overLimit: (column: string, limit: number) => string;
  /** `onMove` rejected, so the card is back where it was. */
  readonly failed: (name: string, column: string, position: number) => string;
}

/** The English defaults; `KanbanBoard`'s `announcements` overrides any of them. */
export const defaultBoardAnnouncements: BoardAnnouncements = {
  pickedUp: (name, column, position, total) =>
    `Picked up ${name} in ${column}. Position ${position} of ${total}.`,
  movedWithin: (name, position, total) => `${name} moved to position ${position} of ${total}.`,
  movedTo: (name, column, position, total) =>
    `${name} moved to ${column}, position ${position} of ${total}.`,
  dropped: (name, column, position, total) =>
    `${name} dropped in ${column}, position ${position} of ${total}.`,
  cancelled: (name, column, position) =>
    `Move cancelled. ${name} returned to ${column}, position ${position}.`,
  overLimit: (column, limit) => `${column} is full: it holds at most ${limit} cards.`,
  failed: (name, column, position) =>
    `Could not move ${name}. It is back in ${column}, position ${position}.`,
};

/** The default count beside a column title: "4", or "4 of 5" with a limit. */
export const defaultBoardCount = (count: number, limit: number | undefined): string =>
  limit === undefined ? `${count}` : `${count} of ${limit}`;

/** Find a card by key. */
export function locate<C>(
  columns: readonly BoardColumn<C>[],
  key: (card: C) => string,
  id: string,
): BoardPlace | undefined {
  for (const [column, { cards }] of columns.entries()) {
    const index = cards.findIndex((card) => key(card) === id);
    if (index >= 0) {
      return { column, index };
    }
  }
  return undefined;
}

/**
 * A copy of `columns` with the card at `from` moved to `to`. `to.index` is
 * clamped into the target column (as it is after the card leaves, when the
 * column is the same). Columns not involved keep their identity.
 */
export function moveCard<C>(
  columns: readonly BoardColumn<C>[],
  from: BoardPlace,
  to: BoardPlace,
): BoardColumn<C>[] {
  const source = columns[from.column];
  const target = columns[to.column];
  if (!source || !target) {
    throw new RangeError(`moveCard: column ${from.column} or ${to.column} is not on the board`);
  }
  if (from.column === to.column) {
    return columns.map((column, i) =>
      i === from.column ? { ...column, cards: move(column.cards, from.index, to.index) } : column,
    );
  }
  const card = source.cards.slice(from.index, from.index + 1);
  if (card.length === 0) {
    throw new RangeError(`moveCard: index ${from.index} is outside ${source.id}`);
  }
  const at = Math.min(Math.max(to.index, 0), target.cards.length);
  return columns.map((column, i) => {
    if (i === from.column) {
      return { ...column, cards: column.cards.filter((_card, j) => j !== from.index) };
    }
    if (i === to.column) {
      return {
        ...column,
        cards: [...column.cards.slice(0, at), ...card, ...column.cards.slice(at)],
      };
    }
    return column;
  });
}

/** Whether a card from another column may enter `column`. */
export const hasRoom = <C>(column: BoardColumn<C>): boolean =>
  column.limit === undefined || column.cards.length < column.limit;

/** Whether a column holds more cards than its limit. */
export const isOverLimit = <C>(column: BoardColumn<C>): boolean =>
  column.limit !== undefined && column.cards.length > column.limit;
