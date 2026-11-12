/**
 * The neutral table `applyMapping` reads: header names and rows of plain
 * cell values, whatever format they came from.
 *
 * It is the smallest shape both of `@thomasfosterau/effect-document`'s
 * candidate tables (#188) reduce to, so each adapter is a few lines:
 *
 * - a `WorksheetRegion`'s typed cells become values: `CellText` its string,
 *   `CellNumber` its number, `CellBoolean` its boolean, `CellDate` its `Date`
 *   (a plain cell is already one of these), a gap or `CellBlank` `undefined`,
 *   and the cells no single value stands for (`CellError`, `CellFormula`,
 *   `CellRichText`) their text;
 * - a `ProseTableRegion`'s `cells` grid is already rows of strings, and its
 *   `headerRows` says where the header is.
 *
 * Either grid then goes through {@link sourceTableFromGrid} with the spec's
 * `headerRow` and `skipRows`. That adapter lands with the effect-document
 * 0.2.0 dependency; until then a caller builds the grid itself.
 *
 * @module
 */

import * as Arr from 'effect/Array';
import * as P from 'effect/Predicate';
import type { ImportSource } from './spec.ts';

/** One cell's value; `undefined` is an empty cell (a gap, or a blank). */
export type SourceCell = string | number | boolean | Date | undefined;

/** One row of a source table, with its position in the table it came from. */
export interface SourceRow {
  /**
   * The row's position in the whole table, counting skipped and header rows,
   * so an edit or an issue keyed by it survives a change to `skipRows` or
   * `headerRow`.
   */
  readonly index: number;
  /** The row's cells by column position; a row may be shorter than the header. */
  readonly cells: ReadonlyArray<SourceCell>;
}

/** A table of source rows: its header names (`[]` when it has no header row) and its data rows. */
export interface SourceTable {
  readonly headers: ReadonlyArray<string>;
  readonly rows: ReadonlyArray<SourceRow>;
}

/** A header cell's text: its string, or the canonical text of any other value. */
const headerText = (cell: SourceCell): string => {
  if (P.isString(cell)) return cell;
  if (P.isDate(cell)) return Number.isNaN(cell.getTime()) ? '' : cell.toISOString();
  return cell === undefined ? '' : String(cell);
};

/**
 * A {@link SourceTable} from a whole grid of cells, read as the spec's source
 * says: the first `skipRows` rows dropped, then the header at `headerRow`
 * among the rest (none when absent), and the rows after it are the data.
 * Each data row keeps its position in `grid` as its `index`.
 */
export const sourceTableFromGrid = (
  grid: ReadonlyArray<ReadonlyArray<SourceCell>>,
  source: Pick<ImportSource, 'headerRow' | 'skipRows'>,
): SourceTable => {
  const header = source.headerRow === undefined ? undefined : source.skipRows + source.headerRow;
  const firstData = header === undefined ? source.skipRows : header + 1;
  const rows = Arr.map(grid, (cells, index): SourceRow => ({ index, cells }));
  return {
    headers: header === undefined ? [] : Arr.map(grid[header] ?? [], headerText),
    rows: Arr.drop(rows, firstData),
  };
};
