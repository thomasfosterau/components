<!-- @component
The import's field map: one row per target field, each choosing the source column it reads, pre-filled from the column headers.
-->
<!--
  ImportFieldMap — one `FormField` per target field: its title, description
  and required flag, a `Select` of the table's columns (or none), and a
  sample of the values the chosen column holds. The choices are pre-filled
  from `suggestMapping` and marked as suggestions until the user picks a
  column themselves. A column may feed more than one field, and the columns
  no field reads are listed, so it is visible what the import drops. A
  checkbox says whether the first row is the header; until slice 4's read
  options land, it is the one read option, because a CSV whose columns are
  all text gives the reader no reason to guess it.

  `choices` and `read` are bindable. A required field with no column is an
  error only once `showErrors` is set (the mapper sets it when the user
  tries to go on), so the step does not open on a wall of errors.

  ARIA contract: each field's label, hint (description, suggestion and
  sample) and errors stay tied together through `FormField`, and its column
  picker is a native `Select`. The list of unused columns is plain text in a
  polite `role="status"` region, so a change is announced.
-->
<script lang="ts" generics="S extends ServiceFreeTarget">
  import { Checkbox, FormField, Select } from '@thomasfosterau/components';
  import {
    sourceTableFromRegion,
    suggestMapping,
    type FieldDescriptor,
    type ImportTarget,
    type SourceCell,
    type SourceRead,
  } from '@thomasfosterau/components-import';
  import type { TableRegion } from '@thomasfosterau/effect-document/schema';
  import { untrack } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    columnCount,
    seedChoices,
    unusedColumns,
    type FieldChoices,
    type ServiceFreeTarget,
  } from './session.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The import target, from `importTarget(schema)`. */
    target: ImportTarget<S>;
    /** The table to map: the source step's chosen table. */
    table: TableRegion;
    /** Where the header is and how many rows are skipped. Bindable. */
    read: SourceRead;
    /** Each target field's column, keyed by field. Bindable; seeded from the suggestions. */
    choices?: FieldChoices | undefined;
    /**
     * Show the error on each required field that has no column.
     * @defaultValue `false`
     */
    showErrors?: boolean | undefined;
    /**
     * How many of the first rows the sample shows values from.
     * @defaultValue `3`
     */
    sampleSize?: number | undefined;
    /**
     * The header checkbox's label.
     * @defaultValue `'The first row is the header'`
     */
    headerRowLabel?: string | undefined;
    /**
     * The column picker's choice for no column.
     * @defaultValue `'Don’t import'`
     */
    notMappedLabel?: string | undefined;
    /**
     * A column's name when it has no header, by its position from 1.
     * @defaultValue `'Column 1'`, in that shape
     */
    columnLabel?: ((position: number) => string) | undefined;
    /**
     * Read in a field's hint while its column is a suggestion.
     * @defaultValue `'Suggested from the column headers.'`
     */
    suggestedLabel?: string | undefined;
    /**
     * The sample, from the values given.
     * @defaultValue `'Sample: Ada, Lin.'`, in that shape
     */
    sampleMessage?: ((values: readonly string[]) => string) | undefined;
    /**
     * Read when the chosen column is empty in the sampled rows.
     * @defaultValue `'No values in the first rows.'`
     */
    emptySampleLabel?: string | undefined;
    /**
     * The error on a required field with no column.
     * @defaultValue `'Choose a column for this required field.'`
     */
    requiredMessage?: string | undefined;
    /**
     * The list of the columns no field reads.
     * @defaultValue `'Not imported: Notes, Phone.'`, in that shape
     */
    unusedMessage?: ((columns: readonly string[]) => string) | undefined;
    /**
     * Read when every column is imported.
     * @defaultValue `'Every column is imported.'`
     */
    allUsedLabel?: string | undefined;
  }

  let {
    target,
    table,
    read = $bindable(),
    choices = $bindable({}),
    showErrors = false,
    sampleSize = 3,
    headerRowLabel = 'The first row is the header',
    notMappedLabel = 'Don’t import',
    columnLabel = (position) => `Column ${position}`,
    suggestedLabel = 'Suggested from the column headers.',
    sampleMessage = (values) => `Sample: ${values.join(', ')}.`,
    emptySampleLabel = 'No values in the first rows.',
    requiredMessage = 'Choose a column for this required field.',
    unusedMessage = (columns) => `Not imported: ${columns.join(', ')}.`,
    allUsedLabel = 'Every column is imported.',
    class: className,
    ...rest
  }: Props = $props();

  const source = $derived(sourceTableFromRegion(table, read));
  const width = $derived(columnCount(source));
  const nameOfColumn = (index: number): string => {
    const header = source.headers[index] ?? '';
    return header === '' ? columnLabel(index + 1) : header;
  };
  const columnOptions = $derived([
    { value: '', label: notMappedLabel },
    ...Array.from({ length: width }, (_, index) => ({
      value: String(index),
      label: nameOfColumn(index),
    })),
  ]);

  // Re-seed whenever the table or its read changes: a suggestion follows the
  // headers, a column the user chose stays.
  $effect(() => {
    const suggestions = suggestMapping(target, source);
    choices = seedChoices(
      target,
      suggestions,
      untrack(() => choices),
    );
  });

  const hasHeader = $derived(read.headerRow !== undefined);
  const setHeader = (on: boolean): void => {
    read = on ? { headerRow: 0, skipRows: read.skipRows } : { skipRows: read.skipRows };
  };

  const cellText = (cell: SourceCell): string => {
    if (cell === undefined) return '';
    if (cell instanceof Date) return Number.isNaN(cell.getTime()) ? '' : cell.toISOString();
    return String(cell).trim();
  };

  const sampleOf = (column: number): readonly string[] =>
    source.rows
      .slice(0, sampleSize)
      .map((row) => cellText(row.cells[column]))
      .filter((text) => text !== '');

  const hintOf = (field: FieldDescriptor): string => {
    const choice = choices[field.key];
    const parts: string[] = [];
    if (field.description !== undefined) parts.push(field.description);
    if (choice?.column !== undefined) {
      if (choice.suggested) parts.push(suggestedLabel);
      const sample = sampleOf(choice.column);
      parts.push(sample.length === 0 ? emptySampleLabel : sampleMessage(sample));
    }
    return parts.join(' ');
  };

  const choose = (key: string, value: string): void => {
    choices = {
      ...choices,
      [key]: { column: value === '' ? undefined : Number(value), suggested: false },
    };
  };

  const unused = $derived(
    unusedColumns(width, choices).map(nameOfColumn),
  );
</script>

<div {...rest} class={['flex flex-col gap-4', className]}>
  <Checkbox label={headerRowLabel} checked={hasHeader} onchange={(event) => setHeader(event.currentTarget.checked)} />

  {#each target.descriptor.fields as field (field.key)}
    {@const choice = choices[field.key]}
    {@const hint = hintOf(field)}
    <FormField
      label={field.title ?? field.key}
      required={field.isRequired}
      hint={hint === '' ? undefined : hint}
      errors={showErrors && field.isRequired && choice?.column === undefined ? [requiredMessage] : []}
    >
      {#snippet children(control)}
        <Select
          {...control}
          options={columnOptions}
          value={choice?.column === undefined ? '' : String(choice.column)}
          onchange={(event) => choose(field.key, event.currentTarget.value)}
        />
      {/snippet}
    </FormField>
  {/each}

  <p role="status" class="text-base-content/70 text-sm">
    {unused.length === 0 ? allUsedLabel : unusedMessage(unused)}
  </p>
</div>
