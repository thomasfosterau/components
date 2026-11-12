/**
 * The keyboard arithmetic behind an editing `DataGrid` (the APG Grid pattern).
 *
 * The grid is a matrix of cells: row 0 is the header row, rows 1… are the
 * body rows on screen, and every column on screen (the selection column
 * included) is one column. Every key the pattern defines resolves to a move
 * over that matrix or to a switch between navigation and edit mode; the
 * functions below are those resolutions, pure, so they are unit-testable
 * without a DOM and `EditableGrid.svelte` only wires events to them.
 *
 * @module
 */

/** A cell of the grid: 0-based row (0 is the header row) and column. */
export interface GridPoint {
  readonly row: number;
  readonly col: number;
}

/** The size of the grid on screen, and how far Page Up / Page Down move. */
export interface GridBounds {
  /** Rows, the header row included. */
  readonly rows: number;
  readonly cols: number;
  /** Rows Page Up / Page Down move by. */
  readonly page: number;
}

/** What a key does to a grid in edit mode. */
export type GridEditKey = 'commit-down' | 'commit-next' | 'commit-previous' | 'cancel';

/** How a key in navigation mode starts editing: in place, by typing over the value, or opening a select. */
export type GridEditStart = 'edit' | 'type' | 'open';

/** The modifier state and key of a keyboard event, as the functions here read it. */
export interface GridKeyEvent {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
}

const clamp = (value: number, max: number): number => Math.min(Math.max(value, 0), max);

/** `at`, moved inside `bounds` — for a grid that shrank under the active cell. */
export function clampPoint(at: GridPoint, bounds: GridBounds): GridPoint {
  return { row: clamp(at.row, bounds.rows - 1), col: clamp(at.col, bounds.cols - 1) };
}

type Move = (at: GridPoint, bounds: GridBounds) => GridPoint;

const plainMoves: Record<string, Move> = {
  ArrowUp: (at) => ({ row: at.row - 1, col: at.col }),
  ArrowDown: (at) => ({ row: at.row + 1, col: at.col }),
  ArrowLeft: (at) => ({ row: at.row, col: at.col - 1 }),
  ArrowRight: (at) => ({ row: at.row, col: at.col + 1 }),
  Home: (at) => ({ row: at.row, col: 0 }),
  End: (at, bounds) => ({ row: at.row, col: bounds.cols - 1 }),
  PageUp: (at, bounds) => ({ row: at.row - bounds.page, col: at.col }),
  PageDown: (at, bounds) => ({ row: at.row + bounds.page, col: at.col }),
};

const controlMoves: Record<string, Move> = {
  Home: () => ({ row: 0, col: 0 }),
  End: (_, bounds) => ({ row: bounds.rows - 1, col: bounds.cols - 1 }),
};

/**
 * Where a navigation-mode key moves the active cell, or `undefined` for a
 * key that is not a move. Moves stop at the edges rather than wrapping, as
 * the APG grid does.
 */
export function gridMove(
  event: GridKeyEvent,
  at: GridPoint,
  bounds: GridBounds,
): GridPoint | undefined {
  if (event.altKey) return undefined;
  const control = event.ctrlKey || event.metaKey;
  const move = control ? controlMoves[event.key] : plainMoves[event.key];
  return move === undefined ? undefined : clampPoint(move(at, bounds), bounds);
}

/** Whether a key would type a character: one character, no command modifier. */
export function isPrintableKey(event: GridKeyEvent): boolean {
  return (
    event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey
  );
}

/** How a navigation-mode key starts editing the active cell, if it does. */
export function gridEditStart(event: GridKeyEvent): GridEditStart | undefined {
  if (event.key === 'Enter' || event.key === 'F2') return 'edit';
  if (event.altKey && event.key === 'ArrowDown') return 'open';
  return isPrintableKey(event) ? 'type' : undefined;
}

/** What an edit-mode key does, if anything: commit and move, or cancel. */
export function gridEditKey(event: GridKeyEvent): GridEditKey | undefined {
  if (event.key === 'Escape') return 'cancel';
  if (event.key === 'Tab') return event.shiftKey ? 'commit-previous' : 'commit-next';
  if (event.key === 'Enter' && !event.shiftKey && !event.altKey) return 'commit-down';
  return undefined;
}

/**
 * Where focus goes after a commit: down a row for Enter, the next or
 * previous cell in reading order for Tab / Shift+Tab (wrapping between body
 * rows, never into the header). At the grid's edge it stays put.
 */
export function pointAfterCommit(key: GridEditKey, at: GridPoint, bounds: GridBounds): GridPoint {
  if (key === 'commit-down') return clampPoint({ row: at.row + 1, col: at.col }, bounds);
  if (key === 'commit-next') {
    if (at.col < bounds.cols - 1) return { row: at.row, col: at.col + 1 };
    return at.row < bounds.rows - 1 ? { row: at.row + 1, col: 0 } : at;
  }
  if (key === 'commit-previous') {
    if (at.col > 0) return { row: at.row, col: at.col - 1 };
    return at.row > 1 ? { row: at.row - 1, col: bounds.cols - 1 } : at;
  }
  return at;
}
