/**
 * The effect-document adapter: a candidate table of a document read
 * (`candidateTables`, effect-document#188) as the engine's
 * {@link SourceTable}, and the region a spec's `source.table` names.
 *
 * Only `@thomasfosterau/effect-document/schema` is imported: it needs no
 * reader, so `@thomasfosterau/effect-parse` (the readers' grammars) is not a
 * peer of this package. An app imports the reader subpaths it accepts.
 *
 * @module
 */

import {
  candidateTables,
  cellOf,
  cellToText,
  type CellSpan,
  type Document,
  type MergeRange,
  type ProseTableRegion,
  type RowCell,
  rowCellsOf,
  rowIndexes,
  type SheetCell,
  type TableLocator,
  type TableRegion,
  type WorksheetRegion,
} from '@thomasfosterau/effect-document/schema';
import * as Arr from 'effect/Array';
import * as Equivalence from 'effect/Equivalence';
import * as Match from 'effect/Match';
import * as Option from 'effect/Option';
import * as P from 'effect/Predicate';
import {
  headerIndex,
  headerText,
  type SourceCell,
  type SourceRead,
  type SourceRow,
  type SourceTable,
  sourceTableFromGrid,
  sourceTableFromRows,
} from './table.ts';

/**
 * A typed worksheet cell as a source cell. Each kind maps to the value a CSV
 * export of the same sheet would carry, so a workbook and its CSV map alike:
 *
 * - `CellText`, `CellNumber`, `CellBoolean`: its value (a plain cell is one
 *   of these already);
 * - `CellDate`: its `Date`, which the engine hands the target as ISO 8601;
 * - `CellFormula`: its cached `result` text, or no value when the file
 *   carries none (the formula itself is never the value);
 * - `CellRichText`: its runs' plain text (a hyperlink's text, not its URL);
 * - `CellError`: its literal, such as `"#DIV/0!"`, so the review step shows
 *   it and a `parse.nullValues` entry can empty it;
 * - `CellBlank`: no value.
 */
const sheetCellValue = (cell: SheetCell): SourceCell =>
  Match.valueTags(cell, {
    CellText: ({ value }): SourceCell => value,
    CellNumber: ({ value }) => value,
    CellBoolean: ({ value }) => value,
    CellDate: ({ value }) => value,
    CellError: ({ value }) => value,
    CellFormula: ({ result }) => result,
    CellRichText: (rich) => cellToText(rich),
    CellBlank: () => undefined,
  });

/** A worksheet row position as a source cell: a plain cell as it is, a gap as no value. */
const rowCellValue = (position: RowCell): SourceCell =>
  P.isString(position) || P.isNumber(position) || P.isBoolean(position)
    ? position
    : Option.match(Option.fromUndefinedOr(cellOf(position)), {
        onNone: () => undefined,
        onSome: sheetCellValue,
      });

/** A worksheet merge as the span a prose table lists. */
const spanOfMerge = (merge: MergeRange): CellSpan => ({
  row: merge.fromRow,
  column: merge.fromCol,
  rowSpan: merge.toRow - merge.fromRow + 1,
  colSpan: merge.toCol - merge.fromCol + 1,
});

/** Whether `span` covers the position, its own top-left cell excluded. */
const covers = (span: CellSpan, row: number, column: number): boolean =>
  row >= span.row &&
  row < span.row + span.rowSpan &&
  column >= span.column &&
  column < span.column + span.colSpan &&
  (row !== span.row || column !== span.column);

/**
 * `table`'s headers with each position a merged cell covers named by that
 * cell, so a header merged across two columns names both: the rows carry a
 * covered position as no value. The header widens to the merges' extent.
 */
const withMergedHeaders = (
  table: SourceTable,
  rows: ReadonlyArray<SourceRow>,
  spans: ReadonlyArray<CellSpan>,
  source: SourceRead,
): SourceTable => {
  const header = headerIndex(source);
  if (header === undefined) return table;
  const width = Arr.reduce(spans, table.headers.length, (widest, span) =>
    covers(span, header, span.column + span.colSpan - 1)
      ? Math.max(widest, span.column + span.colSpan)
      : widest,
  );
  const textAt = (row: number, column: number): Option.Option<string> =>
    Arr.findFirst(rows, (candidate) => candidate.index === row).pipe(
      Option.map((found) => headerText(found.cells[column])),
    );
  const nameOf = (column: number): string => {
    const own = table.headers[column] ?? '';
    if (own !== '') return own;
    return Arr.findFirst(spans, (span) => covers(span, header, column)).pipe(
      Option.flatMap((span) => textAt(span.row, span.column)),
      Option.getOrElse(() => own),
    );
  };
  return {
    headers: width === 0 ? table.headers : Arr.map(Arr.range(0, width - 1), nameOf),
    rows: table.rows,
  };
};

const worksheetTable = (region: WorksheetRegion, source: SourceRead): SourceTable => {
  const sheet = region.worksheet;
  const rows = Arr.map(Arr.zip(rowIndexes(sheet), sheet.rows), ([index, row]): SourceRow => ({
    index,
    cells: Arr.map(rowCellsOf(row), rowCellValue),
  }));
  return withMergedHeaders(
    sourceTableFromRows(rows, source),
    rows,
    Arr.map(sheet.merges, spanOfMerge),
    source,
  );
};

const proseTable = (region: ProseTableRegion, source: SourceRead): SourceTable => {
  const grid = Arr.map(region.cells, (cells, row) =>
    Arr.map(cells, (text, column): SourceCell =>
      Arr.some(region.spans, (span) => covers(span, row, column)) ? undefined : text,
    ),
  );
  const rows = Arr.map(grid, (cells, index): SourceRow => ({ index, cells }));
  return withMergedHeaders(sourceTableFromGrid(grid, source), rows, region.spans, source);
};

/**
 * Where a region's header is by its own account: a worksheet's first row
 * when `candidateTables` guessed it is a header (`WorksheetRegion.headerRow`),
 * a prose table's last head row (`ProseTableRegion.headerRows`), and nothing
 * skipped. It is the default of {@link sourceTableFromRegion}, and what a UI
 * seeds the spec's `headerRow` and `skipRows` with before the user overrides
 * them.
 */
export const regionRead = (region: TableRegion): SourceRead =>
  Match.valueTags(region, {
    WorksheetRegion: ({ headerRow }): SourceRead =>
      headerRow ? { headerRow: 0, skipRows: 0 } : { skipRows: 0 },
    ProseTableRegion: ({ headerRows }): SourceRead =>
      headerRows > 0 ? { headerRow: headerRows - 1, skipRows: 0 } : { skipRows: 0 },
  });

/**
 * A {@link SourceTable} from one of a document's candidate tables, read as
 * `source` says (a spec's `source`, or by default the region's own header
 * guess, {@link regionRead}): the first `skipRows` rows dropped, the header
 * at `headerRow` among the rest (none when absent), the rows after it the
 * data. Every row's `index` is its position in the region, so an edit keyed
 * by it survives a change to the read.
 *
 * - A `WorksheetRegion`'s typed cells become values (a `CellDate` its
 *   `Date`, a `CellFormula` its cached result, a `CellRichText` its text, a
 *   `CellError` its literal, a gap or `CellBlank` no value), and a row the
 *   sheet does not hold is no row at all, so an empty line never becomes an
 *   issue. Its `index` is the sheet's row index.
 * - A `ProseTableRegion`'s `cells` grid is read as text, a position a merged
 *   cell covers as no value.
 *
 * In either, a header position under a merged cell takes that cell's text,
 * so every column it spans has a name.
 */
export const sourceTableFromRegion = (
  region: TableRegion,
  source: SourceRead = regionRead(region),
): SourceTable =>
  Match.valueTags(region, {
    WorksheetRegion: (worksheet) => worksheetTable(worksheet, source),
    ProseTableRegion: (prose) => proseTable(prose, source),
  });

const sameLocator = Arr.makeEquivalence(Equivalence.strictEqual<number | string>());

/**
 * The candidate table of `doc` at `locator`, such as a stored spec's
 * `source.table`: none when the document has no table there (a preset meant
 * for another file, or a file since edited).
 */
export const findRegion = (doc: Document, locator: TableLocator): Option.Option<TableRegion> =>
  Arr.findFirst(candidateTables(doc), (region) => sameLocator(region.locator, locator));
