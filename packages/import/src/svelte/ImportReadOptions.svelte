<!-- @component
The import's read options: whether the table has a header row and how many rows to skip at its top, previewed live on the table's first rows.
-->
<!--
  ImportReadOptions — the read options every source shares, a worksheet's
  and a prose table's alike: a checkbox for the header row and a
  `NumberField` for the rows to skip above it (a title, a note, a blank
  line). Below them, a `Table` previews the first rows as they will be
  read, under the header names they will be read with, each with its row
  number in the file, so the effect of a change is visible before the
  columns are matched. Format-specific reader options (a CSV's separator,
  quote and encoding) are not here yet.

  `read` is bindable; the mapper seeds it from the table's own header
  guess.

  ARIA contract: both controls are labelled (`Checkbox`, and a `FormField`
  around the spinbutton). The preview is a `table` named by its caption,
  its first column the row header. How many rows will be imported is
  announced through a polite `role="status"` region whenever a change
  moves it.
-->
<script lang="ts">
  import { Checkbox, FormField, NumberField, Table } from '@thomasfosterau/components';
  import {
    sourceTableFromRegion,
    type SourceRead,
    type SourceRow,
  } from '@thomasfosterau/components-import';
  import type { TableRegion } from '@thomasfosterau/effect-document/schema';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cellDisplay, columnCount, withHeaderRow, withSkipRows } from './session.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The table to read: the source step's chosen table. */
    table: TableRegion;
    /** Where the header is and how many rows are skipped. Bindable. */
    read: SourceRead;
    /** Called with `read` whenever the user changes it. */
    onReadChange?: ((read: SourceRead) => void) | undefined;
    /**
     * How many data rows the preview shows.
     * @defaultValue `5`
     */
    previewSize?: number | undefined;
    /**
     * The header checkbox's label.
     * @defaultValue `'The first row is the header'`
     */
    headerRowLabel?: string | undefined;
    /**
     * The skipped rows field's label.
     * @defaultValue `'Rows to skip at the top'`
     */
    skipRowsLabel?: string | undefined;
    /**
     * The skipped rows field's hint.
     * @defaultValue `'Rows above the table, such as a title or a note.'`
     */
    skipRowsHint?: string | undefined;
    /**
     * The preview table's caption, its accessible name.
     * @defaultValue `'Preview of the first rows'`
     */
    previewLabel?: string | undefined;
    /**
     * The preview's row number column.
     * @defaultValue `'Row'`
     */
    rowLabel?: string | undefined;
    /**
     * A column's name when it has no header, by its position from 1.
     * @defaultValue `'Column 1'`, in that shape
     */
    columnLabel?: ((position: number) => string) | undefined;
    /**
     * Shown in the preview when the read leaves no rows.
     * @defaultValue `'No rows to import.'`
     */
    emptyLabel?: string | undefined;
    /**
     * How many rows will be imported, announced as it changes.
     * @defaultValue `'3 rows to import.'`, in that shape
     */
    rowCountMessage?: ((rows: number) => string) | undefined;
  }

  let {
    table,
    read = $bindable(),
    onReadChange,
    previewSize = 5,
    headerRowLabel = 'The first row is the header',
    skipRowsLabel = 'Rows to skip at the top',
    skipRowsHint = 'Rows above the table, such as a title or a note.',
    previewLabel = 'Preview of the first rows',
    rowLabel = 'Row',
    columnLabel = (position) => `Column ${position}`,
    emptyLabel = 'No rows to import.',
    rowCountMessage = (rows) => `${rows} ${rows === 1 ? 'row' : 'rows'} to import.`,
    class: className,
    ...rest
  }: Props = $props();

  const source = $derived(sourceTableFromRegion(table, read));
  const preview = $derived(source.rows.slice(0, previewSize));

  const columns = $derived([
    {
      key: 'row',
      header: rowLabel,
      value: (row: SourceRow) => row.index + 1,
      rowHeader: true,
      hideable: false,
    },
    ...Array.from({ length: columnCount(source) }, (_, index) => {
      const header = source.headers[index] ?? '';
      return {
        key: `column-${index}`,
        header: header === '' ? columnLabel(index + 1) : header,
        value: (row: SourceRow) => cellDisplay(row.cells[index]),
      };
    }),
  ]);

  const update = (next: SourceRead): void => {
    read = next;
    onReadChange?.(next);
  };
</script>

<div {...rest} class={['flex flex-col gap-4', className]}>
  <Checkbox
    label={headerRowLabel}
    checked={read.headerRow !== undefined}
    onchange={(event) => update(withHeaderRow(read, event.currentTarget.checked))}
  />

  <FormField label={skipRowsLabel} hint={skipRowsHint}>
    {#snippet children(control)}
      <NumberField
        {...control}
        value={read.skipRows}
        min={0}
        step={1}
        formatOptions={{ maximumFractionDigits: 0 }}
        onCommit={(value) => update(withSkipRows(read, value))}
      />
    {/snippet}
  </FormField>

  <div class="overflow-x-auto">
    <Table
      rows={preview}
      {columns}
      rowKey={(row) => String(row.index)}
      caption={previewLabel}
      size="sm"
      emptyMessage={emptyLabel}
    />
  </div>

  <p role="status" class="text-base-content/70 text-sm">{rowCountMessage(source.rows.length)}</p>
</div>
