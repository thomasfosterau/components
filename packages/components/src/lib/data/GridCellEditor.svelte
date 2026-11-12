<!-- @component
The control an editing `DataGrid` cell shows in edit mode; internal, not exported.
-->
<!--
  GridCellEditor — the field primitive a column's `editor` names, bound to
  the cell's draft, or the column's own snippet. There is no editor set of
  its own: every control is the one `fields/` exports, with the same
  `FieldControl` wiring a `FormField` would give it.

  ARIA contract: the control is named by the column header
  (`aria-labelledby`, or the `labelId` a role-based control such as
  `DateField` points its group at), and takes the cell's error description
  and `aria-invalid` through `describedBy` / `invalid`. The keys that commit
  and cancel are the grid's (see `EditableGrid`); the control keeps its own
  — a `NumberField`'s arrows step, a `Select` opens on Alt+Down, a
  `DateField`'s arrows move between segments.
-->
<script lang="ts" generics="T">
  import type { DateValue } from '@internationalized/date';
  import { CalendarDate, CalendarDateTime, ZonedDateTime } from '@internationalized/date';
  import DateField from '../fields/DateField.svelte';
  import NumberField from '../fields/NumberField.svelte';
  import Select from '../fields/Select.svelte';
  import TextInput from '../fields/TextInput.svelte';
  import type { FieldControl } from '../fields/field-types.ts';
  import { namedEditor } from './grid-edit.ts';
  import type { CellEditorContext, TableColumn } from './table-types.ts';

  interface Props {
    /** The column being edited. */
    column: TableColumn<T>;
    /** The draft. Bindable. */
    value: unknown;
    /** What a snippet editor is handed, less the `value` and `control` given here. */
    context: Omit<CellEditorContext<T>, 'value' | 'control'>;
    /** The wiring every control takes by spread. */
    control: FieldControl;
    /** BCP 47 locale(s) for the number and date editors. */
    locales: string | readonly string[] | undefined;
  }

  let { column, value = $bindable(), context, control, locales }: Props = $props();

  const kind = $derived(namedEditor(column));
  const text = (draft: unknown): string => (typeof draft === 'string' ? draft : '');
  const asNumber = (draft: unknown): number | undefined =>
    typeof draft === 'number' ? draft : undefined;
  const asDate = (draft: unknown): DateValue | undefined =>
    draft instanceof CalendarDate || draft instanceof CalendarDateTime || draft instanceof ZonedDateTime
      ? draft
      : undefined;
</script>

{#if kind === 'number'}
  <NumberField
    {...control}
    aria-labelledby={control.labelId}
    size="sm"
    showStepper={false}
    {locales}
    bind:value={() => asNumber(value), (next) => (value = next)}
  />
{:else if kind === 'select'}
  <Select
    {...control}
    aria-labelledby={control.labelId}
    size="sm"
    options={column.options ?? []}
    bind:value={() => text(value), (next) => (value = next)}
  />
{:else if kind === 'date'}
  <DateField
    {...control}
    size="sm"
    {locales}
    bind:value={() => asDate(value), (next) => (value = next)}
  />
{:else if kind === 'text'}
  <TextInput
    {...control}
    aria-labelledby={control.labelId}
    size="sm"
    bind:value={() => text(value), (next) => (value = next)}
  />
{:else if typeof column.editor === 'function'}
  {@render column.editor({ ...context, value, control })}
{/if}
