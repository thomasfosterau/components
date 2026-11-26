<!-- @component
The import's read options: whether the table has a header row and how many rows to skip at its top, and for a delimited text format with a `readerWith` its encoding, separator, quote, ragged rows and type inference, previewed live on the table's first rows.
-->
<!--
  ImportReadOptions — the read options every source shares, a worksheet's
  and a prose table's alike: a checkbox for the header row and a
  `NumberField` for the rows to skip above it (a title, a note, a blank
  line). Below them, a `Table` previews the first rows as they will be
  read, under the header names they will be read with, each with its row
  number in the file, so the effect of a change is visible before the
  columns are matched.

  When `source`'s format has a `readerWith`, the reader options come first:
  the text encoding, the separator (the format's default, a comma, a
  semicolon or a tab), the quote (once a separator is chosen), whether rows
  may differ in width, and whether numbers and true or false values are
  read as such. A change re-reads the file with them, at most
  `previewRows` records, and the preview shows that read; a read they
  break is an error in place of the preview. The whole file is read with
  them when the mapper moves on.

  `read` and `reader` are bindable; the mapper seeds `read` from the
  table's own header guess, and `reader` from how the file was read.

  ARIA contract: every control is labelled (`Checkbox`es, and `FormField`s
  around the selects and the spinbutton). The preview is a `table` named
  by its caption, its first column the row header. How many rows will be
  imported is announced through a polite `role="status"` region whenever
  a change moves it, and a failed read through an `Alert`'s `role="alert"`.
  The step is `aria-busy` while a preview is read.
-->
<script lang="ts">
  import { Alert, Checkbox, FormField, NumberField, Select, Table } from '@thomasfosterau/components';
  import {
    sourceTableFromRegion,
    type SourceRead,
    type SourceRow,
  } from '@thomasfosterau/components-import';
  import type { TableRegion } from '@thomasfosterau/effect-document/schema';
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    cellDisplay,
    columnCount,
    defaultReaderChoice,
    readFile,
    sameReaderChoice,
    StepError,
    withHeaderRow,
    withSkipRows,
    type ImportFile,
    type QuoteChoice,
    type ReaderChoice,
    type SeparatorChoice,
  } from './session.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The table to read: the source step's chosen table. */
    table: TableRegion;
    /** Where the header is and how many rows are skipped. Bindable. */
    read: SourceRead;
    /** Called with `read` whenever the user changes it. */
    onReadChange?: ((read: SourceRead) => void) | undefined;
    /**
     * The file `table` is from. When its format has a `readerWith`, the step
     * offers the reader options and previews the file read with them.
     */
    source?: ImportFile | undefined;
    /**
     * How to read `source`. Bindable.
     * @defaultValue how `source` was read, or the default choice
     */
    reader?: ReaderChoice | undefined;
    /** Called with `reader` whenever the user changes it. */
    onReaderChange?: ((reader: ReaderChoice) => void) | undefined;
    /**
     * The most records a preview read takes, a header row counting as one.
     * @defaultValue `200`
     */
    previewRows?: number | undefined;
    /**
     * The encodings offered besides detecting it, by their WHATWG names.
     * @defaultValue UTF-8, UTF-16, Windows-1252, ISO-8859-15, Mac Roman and the common CJK encodings
     */
    encodings?: readonly string[] | undefined;
    /**
     * The encoding field's label.
     * @defaultValue `'Text encoding'`
     */
    encodingLabel?: string | undefined;
    /**
     * The choice to detect the encoding.
     * @defaultValue `'Detect automatically'`
     */
    detectEncodingLabel?: string | undefined;
    /**
     * The separator field's label.
     * @defaultValue `'Separator'`
     */
    separatorLabel?: string | undefined;
    /**
     * Each separator's name.
     * @defaultValue `'Format default'`, `'Comma'`, `'Semicolon'` and `'Tab'`
     */
    separatorLabels?: Readonly<Record<SeparatorChoice, string>> | undefined;
    /**
     * The quote field's label.
     * @defaultValue `'Quote character'`
     */
    quoteLabel?: string | undefined;
    /**
     * Each quote's name.
     * @defaultValue `'Double quote (")'` and `"Single quote (')"`
     */
    quoteLabels?: Readonly<Record<QuoteChoice, string>> | undefined;
    /**
     * The ragged rows checkbox's label.
     * @defaultValue `'Rows may have different numbers of fields'`
     */
    raggedRowsLabel?: string | undefined;
    /**
     * The type inference checkbox's label.
     * @defaultValue `'Read numbers and true or false values'`
     */
    inferTypesLabel?: string | undefined;
    /**
     * Shown in place of the preview when the reader options fail to read the file, with its reason after it.
     * @defaultValue `'The file could not be read with these options.'`
     */
    readFailedMessage?: string | undefined;
    /**
     * Shown in place of the preview when the reader options leave the file without its table.
     * @defaultValue `'With these options, the file has no table to import.'`
     */
    noTableMessage?: string | undefined;
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
    /**
     * How many rows a preview read found when the file has more, announced as it changes.
     * @defaultValue `'At least 199 rows to import.'`, in that shape
     */
    moreRowsMessage?: ((rows: number) => string) | undefined;
  }

  let {
    table,
    read = $bindable(),
    onReadChange,
    source,
    reader = $bindable(source?.reader ?? defaultReaderChoice),
    onReaderChange,
    previewRows = 200,
    encodings = [
      'UTF-8',
      'UTF-16LE',
      'UTF-16BE',
      'windows-1252',
      'ISO-8859-15',
      'macintosh',
      'Shift_JIS',
      'EUC-JP',
      'GBK',
      'Big5',
      'EUC-KR',
    ],
    encodingLabel = 'Text encoding',
    detectEncodingLabel = 'Detect automatically',
    separatorLabel = 'Separator',
    separatorLabels = { auto: 'Format default', ',': 'Comma', ';': 'Semicolon', '\t': 'Tab' },
    quoteLabel = 'Quote character',
    quoteLabels = { '"': 'Double quote (")', "'": "Single quote (')" },
    raggedRowsLabel = 'Rows may have different numbers of fields',
    inferTypesLabel = 'Read numbers and true or false values',
    readFailedMessage = 'The file could not be read with these options.',
    noTableMessage = 'With these options, the file has no table to import.',
    previewSize = 5,
    headerRowLabel = 'The first row is the header',
    skipRowsLabel = 'Rows to skip at the top',
    skipRowsHint = 'Rows above the table, such as a title or a note.',
    previewLabel = 'Preview of the first rows',
    rowLabel = 'Row',
    columnLabel = (position) => `Column ${position}`,
    emptyLabel = 'No rows to import.',
    rowCountMessage = (rows) => `${rows} ${rows === 1 ? 'row' : 'rows'} to import.`,
    moreRowsMessage = (rows) => `At least ${rows} ${rows === 1 ? 'row' : 'rows'} to import.`,
    class: className,
    ...rest
  }: Props = $props();

  const separators: readonly SeparatorChoice[] = ['auto', ',', ';', '\t'];
  const quotes: readonly QuoteChoice[] = ['"', "'"];
  // A select's value is a string; the empty one stands for detecting the encoding.
  const encodingOptions = $derived([
    { value: '', label: detectEncodingLabel },
    ...encodings.map((name) => ({ value: name, label: name })),
  ]);

  const configurable = $derived(source?.format.readerWith !== undefined);

  /** The preview read with `reader`, when it differs from how `source` was read. */
  let previewed = $state.raw<
    | { readonly table: TableRegion; readonly truncated: boolean }
    | { readonly error: string }
    | undefined
  >(undefined);
  let busy = $state(false);

  $effect(() => {
    const file = source;
    const choice = reader;
    const limit = previewRows;
    if (
      file === undefined ||
      file.format.readerWith === undefined ||
      sameReaderChoice(choice, file.reader)
    ) {
      previewed = undefined;
      busy = false;
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;
    busy = true;
    const load = async (): Promise<void> => {
      try {
        const { tables, truncated } = await readFile(file.file, file.format, {
          reader: choice,
          maxRows: limit,
          signal,
        });
        if (signal.aborted) return;
        const next = tables[file.tables.indexOf(file.table)] ?? tables[0];
        previewed = next === undefined ? { error: noTableMessage } : { table: next, truncated };
      } catch (cause) {
        if (signal.aborted) return;
        const detail = cause instanceof StepError ? ` ${cause.message}` : '';
        previewed = { error: `${readFailedMessage}${detail}` };
      }
      busy = false;
    };
    void load();
    return () => controller.abort();
  });

  const shown = $derived(
    previewed !== undefined && 'table' in previewed ? previewed.table : table,
  );
  const failure = $derived(
    previewed !== undefined && 'error' in previewed ? previewed.error : undefined,
  );
  const truncated = $derived(
    previewed !== undefined && 'truncated' in previewed && previewed.truncated,
  );

  const rowsRead = $derived(sourceTableFromRegion(shown, read));
  const preview = $derived(rowsRead.rows.slice(0, previewSize));

  const columns = $derived([
    {
      key: 'row',
      header: rowLabel,
      value: (row: SourceRow) => row.index + 1,
      rowHeader: true,
      hideable: false,
    },
    ...Array.from({ length: columnCount(rowsRead) }, (_, index) => {
      const header = rowsRead.headers[index] ?? '';
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

  const choose = (change: Partial<ReaderChoice>): void => {
    const next = { ...reader, ...change };
    reader = next;
    onReaderChange?.(next);
  };
</script>

<div {...rest} class={['flex flex-col gap-4', className]} aria-busy={busy ? 'true' : undefined}>
  {#if configurable}
    <div class="flex flex-wrap gap-4">
      <FormField label={encodingLabel}>
        {#snippet children(control)}
          <Select
            {...control}
            options={encodingOptions}
            value={reader.encoding ?? ''}
            onchange={(event) => {
              const value = event.currentTarget.value;
              choose({ encoding: value === '' ? undefined : value });
            }}
          />
        {/snippet}
      </FormField>

      <FormField label={separatorLabel}>
        {#snippet children(control)}
          <Select
            {...control}
            options={separators.map((value) => ({ value, label: separatorLabels[value] }))}
            value={reader.separator}
            onchange={(event) => {
              const value = separators.find((s) => s === event.currentTarget.value);
              if (value !== undefined) choose({ separator: value });
            }}
          />
        {/snippet}
      </FormField>

      {#if reader.separator !== 'auto'}
        <FormField label={quoteLabel}>
          {#snippet children(control)}
            <Select
              {...control}
              options={quotes.map((value) => ({ value, label: quoteLabels[value] }))}
              value={reader.quote}
              onchange={(event) => {
                const value = quotes.find((q) => q === event.currentTarget.value);
                if (value !== undefined) choose({ quote: value });
              }}
            />
          {/snippet}
        </FormField>
      {/if}
    </div>

    <Checkbox
      label={raggedRowsLabel}
      checked={reader.allowRaggedRows}
      onchange={(event) => choose({ allowRaggedRows: event.currentTarget.checked })}
    />
    <Checkbox
      label={inferTypesLabel}
      checked={reader.inferTypes}
      onchange={(event) => choose({ inferTypes: event.currentTarget.checked })}
    />
  {/if}

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

  {#if failure === undefined}
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
  {:else}
    <Alert tone="error" live="assertive">{failure}</Alert>
  {/if}

  <p role="status" class="text-base-content/70 text-sm">
    {#if failure === undefined}
      {truncated ? moreRowsMessage(rowsRead.rows.length) : rowCountMessage(rowsRead.rows.length)}
    {/if}
  </p>
</div>
