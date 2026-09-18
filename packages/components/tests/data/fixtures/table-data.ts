/**
 * The rows and columns the `Table` and `DataGrid` suites are driven with.
 *
 * Deliberately three rows whose alphabetical order, insertion order and
 * numeric order all differ: a sort test over data where two of those agree
 * cannot tell a working sort from a no-op.
 */

import type { TableColumn } from '../../../src/lib/data/table-types.ts';

export interface Row {
  readonly id: string;
  readonly name: string;
  readonly count: number;
}

export const rows: readonly Row[] = [
  { id: 'basil', name: 'Basil', count: 30 },
  { id: 'tomato', name: 'Tomato', count: 9 },
  { id: 'garlic', name: 'Garlic', count: 100 },
];

export const rowKey = (row: Row): string => row.id;

export const columns: readonly TableColumn<Row>[] = [
  { key: 'name', header: 'Name', value: (row) => row.name, sortable: true },
  { key: 'count', header: 'Count', value: (row) => row.count, sortable: true, align: 'end' },
];

/** The same columns with no sort controls, for tests about the rows. */
export const plainColumns: readonly TableColumn<Row>[] = columns.map(({ key, header, value }) => ({
  key,
  header,
  value,
}));
