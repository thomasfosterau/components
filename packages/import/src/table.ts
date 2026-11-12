/**
 * The neutral table `applyMapping` reads: header names and rows of plain
 * cell values, whatever format they came from.
 *
 * It is the smallest shape both of `@thomasfosterau/effect-document`'s
 * candidate tables (#188) reduce to: `sourceTableFromRegion` (`region.ts`)
 * turns a `WorksheetRegion` or a `ProseTableRegion` into one, and
 * {@link sourceTableFromGrid} turns any grid a caller built itself. Both read
 * the header and the skipped rows the same way, here.
 *
 * @module
 */

import * as Arr from 'effect/Array';
import * as Option from 'effect/Option';
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

/** The rows a source keeps and where its header is: the spec's `headerRow` and `skipRows`. */
export type SourceRead = Pick<ImportSource, 'headerRow' | 'skipRows'>;

/** A header cell's text: its string, or the canonical text of any other value. */
export const headerText = (cell: SourceCell): string => {
  if (P.isString(cell)) return cell;
  if (P.isDate(cell)) return Number.isNaN(cell.getTime()) ? '' : cell.toISOString();
  return cell === undefined ? '' : String(cell);
};

/** The header row's position in the whole table, counting skipped rows; none without a header. */
export const headerIndex = (source: SourceRead): number | undefined =>
  source.headerRow === undefined ? undefined : source.skipRows + source.headerRow;

/**
 * A {@link SourceTable} from the rows a table holds, each with its position
 * in the table (ascending, and not necessarily every position: a worksheet
 * holds only the rows that have cells), read as {@link sourceTableFromGrid}
 * reads a grid.
 */
export const sourceTableFromRows = (
  rows: ReadonlyArray<SourceRow>,
  source: SourceRead,
): SourceTable => {
  const header = headerIndex(source);
  const firstData = header === undefined ? source.skipRows : header + 1;
  return {
    headers:
      header === undefined
        ? []
        : Arr.findFirst(rows, (row) => row.index === header).pipe(
            Option.match({
              onNone: () => [],
              onSome: (row) => Arr.map(row.cells, headerText),
            }),
          ),
    rows: Arr.filter(rows, (row) => row.index >= firstData),
  };
};

/**
 * A {@link SourceTable} from a whole grid of cells, read as the spec's source
 * says: the first `skipRows` rows dropped, then the header at `headerRow`
 * among the rest (none when absent), and the rows after it are the data.
 * Each data row keeps its position in `grid` as its `index`.
 */
export const sourceTableFromGrid = (
  grid: ReadonlyArray<ReadonlyArray<SourceCell>>,
  source: SourceRead,
): SourceTable =>
  sourceTableFromRows(
    Arr.map(grid, (cells, index): SourceRow => ({ index, cells })),
    source,
  );
