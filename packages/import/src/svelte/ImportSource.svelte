<!-- @component
The import's first step: pick a file, detect its format among the ones the app accepts, and choose the table to import.
-->
<!--
  ImportSource — a `FileInput` for the user's file, then `detect` over the
  formats the app passes. The most likely format is chosen and shown with the
  sniffer's evidence; when more than one format fits, a `Select` lets the user
  override it. The file is read with the chosen format's reader (its
  `readerWith` with the default choice, when it has one), and when it
  holds several tables (several sheets, several tables in a document) a second
  `Select` picks one. Nothing matching, a failed read and a file with no table
  are each a clear error rather than an empty step.

  `source` is bindable: `undefined` until a file is read and a table chosen.

  ARIA contract: every control is a labelled `FormField`. The outcome of
  detection ("Detected CSV, 1 table") is announced through a polite
  `role="status"` region, and a failure through the `role="alert"` of an
  `Alert`, so neither depends on the user finding it on screen.
-->
<script lang="ts">
  import { Alert, FileInput, FormField, Select } from '@thomasfosterau/components';
  import type { TableRegion } from '@thomasfosterau/effect-document/schema';
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    acceptOf,
    defaultReaderChoice,
    detectFile,
    readFile,
    StepError,
    type DetectedFormat,
    type ImportFile,
    type ImportFormat,
  } from './session.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The formats the app accepts, and the ones detection chooses among. */
    formats: readonly ImportFormat[];
    /** The file as read, with its chosen format and table; `undefined` until then. Bindable. */
    source?: ImportFile | undefined;
    /** Called with `source` whenever it changes. */
    onSourceChange?: ((source: ImportFile | undefined) => void) | undefined;
    /**
     * A format's name for the user, by its id; an id not listed is shown in capitals.
     * @defaultValue names for `csv`, `tsv`, `xlsx`, `numbers`, `docx`, `pages`, `rtf` and `pdf`
     */
    formatLabels?: Readonly<Record<string, string>> | undefined;
    /**
     * The file picker's label.
     * @defaultValue `'File to import'`
     */
    fileLabel?: string | undefined;
    /**
     * The format picker's label.
     * @defaultValue `'File format'`
     */
    formatLabel?: string | undefined;
    /**
     * The table picker's label.
     * @defaultValue `'Table to import'`
     */
    tableLabel?: string | undefined;
    /**
     * Announced while the file is examined.
     * @defaultValue `'Reading the file…'`
     */
    detectingLabel?: string | undefined;
    /**
     * Announced once the file is read: the format's name and how many tables it holds.
     * @defaultValue `'Detected CSV, 1 table.'`, in that shape
     */
    detectedMessage?: ((format: string, tables: number) => string) | undefined;
    /**
     * Shown when none of `formats` recognises the file.
     * @defaultValue `'This file is not in a format this import accepts.'`
     */
    noMatchMessage?: string | undefined;
    /**
     * Shown when the file has no table to import.
     * @defaultValue `'This file has no table to import.'`
     */
    noTableMessage?: string | undefined;
    /**
     * Shown when the chosen format's reader fails, with its reason after it.
     * @defaultValue `'This file could not be read as CSV.'`, in that shape
     */
    readFailedMessage?: ((format: string) => string) | undefined;
    /**
     * A table's name when it has neither a sheet name nor a caption, by its position from 1.
     * @defaultValue `'Table 1'`, in that shape
     */
    untitledTableLabel?: ((position: number) => string) | undefined;
  }

  const defaultFormatLabels: Readonly<Record<string, string>> = {
    csv: 'CSV',
    tsv: 'TSV',
    xlsx: 'Excel workbook',
    numbers: 'Numbers spreadsheet',
    docx: 'Word document',
    pages: 'Pages document',
    rtf: 'RTF document',
    pdf: 'PDF',
  };

  let {
    formats,
    source = $bindable(),
    onSourceChange,
    formatLabels = defaultFormatLabels,
    fileLabel = 'File to import',
    formatLabel = 'File format',
    tableLabel = 'Table to import',
    detectingLabel = 'Reading the file…',
    detectedMessage = (format, tables) =>
      `Detected ${format}, ${tables} ${tables === 1 ? 'table' : 'tables'}.`,
    noMatchMessage = 'This file is not in a format this import accepts.',
    noTableMessage = 'This file has no table to import.',
    readFailedMessage = (format) => `This file could not be read as ${format}.`,
    untitledTableLabel = (position) => `Table ${position}`,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const evidenceId = `${uid}-evidence`;

  let file = $state<File | undefined>(source?.file);
  let candidates = $state.raw<readonly DetectedFormat[]>(source?.candidates ?? []);
  let status = $state('');
  let error = $state<string | undefined>(undefined);
  let busy = $state(false);
  let controller: AbortController | undefined;

  const nameOf = (format: ImportFormat): string =>
    formatLabels[format.id] ?? defaultFormatLabels[format.id] ?? format.id.toUpperCase();

  const tableName = (table: TableRegion, position: number): string => {
    const name = table._tag === 'WorksheetRegion' ? table.name : table.caption;
    return name === undefined || name === '' ? untitledTableLabel(position) : name;
  };

  const chosen = $derived(candidates.find((candidate) => candidate.format.id === source?.format.id));
  const formatOptions = $derived(
    candidates.map((candidate) => ({ value: candidate.format.id, label: nameOf(candidate.format) })),
  );
  const tableOptions = $derived(
    (source?.tables ?? []).map((table, index) => ({
      value: String(index),
      label: tableName(table, index + 1),
    })),
  );

  const setSource = (next: ImportFile | undefined): void => {
    source = next;
    onSourceChange?.(next);
  };

  /** A fresh signal for the next step of work, aborting whatever was running. */
  const restart = (): AbortSignal => {
    controller?.abort();
    controller = new AbortController();
    return controller.signal;
  };

  const fail = (message: string): void => {
    setSource(undefined);
    status = '';
    error = message;
  };

  const readAs = async (
    chosenFile: File,
    found: readonly DetectedFormat[],
    candidate: DetectedFormat,
    signal: AbortSignal,
  ): Promise<void> => {
    const name = nameOf(candidate.format);
    try {
      const reader = candidate.format.readerWith === undefined ? undefined : defaultReaderChoice;
      const { tables, encoding } = await readFile(chosenFile, candidate.format, { reader, signal });
      if (signal.aborted) return;
      const [first] = tables;
      if (first === undefined) {
        fail(noTableMessage);
        return;
      }
      error = undefined;
      setSource({
        file: chosenFile,
        candidates: found,
        format: candidate.format,
        tables,
        table: first,
        reader,
        encoding,
      });
      status = detectedMessage(name, tables.length);
    } catch (cause) {
      if (signal.aborted) return;
      const detail = cause instanceof StepError ? ` ${cause.message}` : '';
      fail(`${readFailedMessage(name)}${detail}`);
    }
  };

  const choose = async (chosenFile: File | undefined): Promise<void> => {
    const signal = restart();
    candidates = [];
    error = undefined;
    if (chosenFile === undefined) {
      setSource(undefined);
      status = '';
      return;
    }
    busy = true;
    status = detectingLabel;
    try {
      const found = await detectFile(chosenFile, formats, signal);
      if (signal.aborted) return;
      candidates = found;
      const [best] = found;
      if (best === undefined) {
        fail(noMatchMessage);
        return;
      }
      await readAs(chosenFile, found, best, signal);
    } catch (cause) {
      if (signal.aborted) return;
      fail(cause instanceof Error ? cause.message : noMatchMessage);
    } finally {
      if (!signal.aborted) busy = false;
    }
  };

  const overrideFormat = async (id: string): Promise<void> => {
    const candidate = candidates.find((c) => c.format.id === id);
    if (file === undefined || candidate === undefined) return;
    const signal = restart();
    busy = true;
    status = detectingLabel;
    await readAs(file, candidates, candidate, signal);
    if (!signal.aborted) busy = false;
  };

  const chooseTable = (value: string): void => {
    const table = source?.tables[Number(value)];
    if (source === undefined || table === undefined) return;
    setSource({ ...source, table });
  };
</script>

<div {...rest} class={['flex flex-col gap-4', className]} aria-busy={busy ? 'true' : undefined}>
  <FormField label={fileLabel} required>
    {#snippet children(control)}
      <FileInput {...control} accept={acceptOf(formats)} bind:file onSelect={choose} />
    {/snippet}
  </FormField>

  {#if candidates.length > 1 && source !== undefined}
    <FormField label={formatLabel}>
      {#snippet children(control)}
        <Select
          {...control}
          describedBy={[control.describedBy, evidenceId].filter((id) => id !== '').join(' ')}
          options={formatOptions}
          value={source?.format.id ?? ''}
          onchange={(event) => overrideFormat(event.currentTarget.value)}
        />
      {/snippet}
    </FormField>
  {/if}

  {#if chosen !== undefined}
    <p class="text-base-content/70 text-sm" id={evidenceId}>{chosen.evidence}</p>
  {/if}

  {#if source !== undefined && source.tables.length > 1}
    <FormField label={tableLabel}>
      {#snippet children(control)}
        <Select
          {...control}
          options={tableOptions}
          value={String(source?.tables.indexOf(source.table) ?? 0)}
          onchange={(event) => chooseTable(event.currentTarget.value)}
        />
      {/snippet}
    </FormField>
  {/if}

  <p role="status" class="text-sm">{status}</p>

  {#if error !== undefined}
    <Alert tone="error" live="assertive">{error}</Alert>
  {/if}
</div>
