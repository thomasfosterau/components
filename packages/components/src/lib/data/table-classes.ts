/**
 * The class lookups `Table` and the editing `DataGrid`'s grid share, so the
 * two draw the same table. Literal class names, because Tailwind only emits
 * what it can read verbatim.
 *
 * @module
 */

import type { Size } from '../ui/tones.ts';
import type { TableColumn } from './table-types.ts';

/** Literal daisyUI class per `Size` for a `table`. */
export const tableSize: Record<Size, string> = {
  xs: 'table-xs',
  sm: 'table-sm',
  md: 'table-md',
  lg: 'table-lg',
  xl: 'table-xl',
};

/** Alignment and the column's own classes, shared by its `<th>` and `<td>`. */
export const columnClass = <T>(column: TableColumn<T>): (string | false | undefined)[] => [
  column.align === 'end' ? 'text-end' : 'text-start',
  column.class,
];
