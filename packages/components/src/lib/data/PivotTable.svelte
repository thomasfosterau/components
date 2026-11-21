<!-- @component
A cross-tab of flat rows: chosen fields on rows and columns, measures aggregated in the cells, with subtotals, totals, collapsible row groups and a field configurator.
-->
<!--
  PivotTable — a plain `<table>`, not a grid, so table navigation works.
  Each `td` lists in `headers` its row groups, column groups and measure,
  so it reads "Bed 4, March, Sum of kg, 12.5" at any depth. A parent row's
  header holds an `aria-expanded` button; collapsed, its subtotal stays.
-->
<script lang="ts" generics="R">
  import type { HTMLAttributes } from 'svelte/elements';
  import { SvelteSet } from 'svelte/reactivity';
  import { getComponentsContext } from '../context.svelte.ts';
  import PivotFields from './PivotFields.svelte';
  import PivotHead from './PivotHead.svelte';
  import PivotRow from './PivotRow.svelte';
  import {
    parentIds,
    pathId,
    pivotLayout,
    type PivotBodyRow,
    type PivotDataCell,
    type PivotHeaderCell,
  } from './pivot-layout.ts';
  import { pivot, type PivotConfig, type PivotDateGrouping, type PivotValue } from './pivot.ts';
  import {
    defaultPivotFieldsLabels,
    isBuiltInAggregate,
    type PivotBuiltInAggregate,
    type PivotField,
    type PivotFieldsLabels,
  } from './pivot-fields.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /** The flat records. */
    data: readonly R[];
    /** Which fields go where. Bindable: the configurator reassigns it. */
    config: PivotConfig<R>;
    /** Every field the configurator offers, with its label. */
    fields: readonly PivotField<R>[];
    /** The table's caption: its accessible name. */
    caption: string;
    /**
     * Show the field configurator.
     * @defaultValue `true`
     */
    configurable?: boolean | undefined;
    /**
     * Show a group's subtotal on its row while it is expanded.
     * @defaultValue `true`
     */
    subtotals?: boolean | undefined;
    /**
     * A total row and a total column.
     * @defaultValue `true`
     */
    grandTotals?: boolean | undefined;
    /** Formatting locale(s); defaults to the components context's. */
    locales?: Intl.LocalesArgument | undefined;
    /** How a group key reads; defaults to the key, a date bucket formatted. */
    formatGroup?: ((field: keyof R & string, key: string) => string) | undefined;
    /** @defaultValue `'Total'` */
    totalLabel?: string | undefined;
    /** @defaultValue `'No data'` */
    emptyLabel?: string | undefined;
    /** @defaultValue `'(blank)'` */
    blankLabel?: string | undefined;
    /** @defaultValue `{ sum: 'Sum', count: 'Count', countDistinct: 'Distinct count', mean: 'Mean', median: 'Median', min: 'Min', max: 'Max' }` */
    aggregateLabels?: Readonly<Record<PivotBuiltInAggregate, string>> | undefined;
    /**
     * A measure's header, when its `label` is unset; `aggregate` is
     * `customAggregateLabel` for a function.
     * @defaultValue `` (aggregate, field) => `${aggregate} of ${field}` ``
     */
    valueLabel?: ((aggregate: string, field: string) => string) | undefined;
    /** @defaultValue `'Value'` */
    customAggregateLabel?: string | undefined;
    /** The configurator's strings, over `defaultPivotFieldsLabels`. */
    fieldsLabels?: Partial<PivotFieldsLabels> | undefined;
  }

  let {
    data,
    config = $bindable(),
    fields,
    caption,
    configurable = true,
    subtotals = true,
    grandTotals = true,
    locales,
    formatGroup,
    totalLabel = 'Total',
    emptyLabel = 'No data',
    blankLabel = '(blank)',
    aggregateLabels = {
      sum: 'Sum',
      count: 'Count',
      countDistinct: 'Distinct count',
      mean: 'Mean',
      median: 'Median',
      min: 'Min',
      max: 'Max',
    },
    valueLabel = (aggregate, field) => `${aggregate} of ${field}`,
    customAggregateLabel = 'Value',
    fieldsLabels,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  const uid = $props.id();
  const locale = $derived((locales ?? context.locale()) as Intl.LocalesArgument);

  const result = $derived(pivot(data, config));
  /** Row groups the reader collapsed; everything else is expanded. */
  const collapsed = new SvelteSet<string>();
  const expanded = $derived(new Set(parentIds(result.rows).filter((id) => !collapsed.has(id))));
  const layout = $derived(
    pivotLayout(result, {
      idPrefix: uid,
      rowFields: config.rows.length,
      columnFields: config.columns.length,
      values: config.values.length,
      expanded,
      subtotals,
      grandTotals,
    }),
  );

  const labelOf = (field: string): string =>
    fields.find((each) => each.name === field)?.label ?? field;

  const measureText = (value: PivotValue<R>): string =>
    value.label ??
    valueLabel(
      isBuiltInAggregate(value.agg) ? aggregateLabels[value.agg] : customAggregateLabel,
      labelOf(value.field),
    );
  const measureLabels = $derived(config.values.map(measureText));
  const formats = $derived(
    config.values.map(
      (value) => new Intl.NumberFormat(locale, value.format ?? { maximumFractionDigits: 2 }),
    ),
  );

  const dateFormats: Record<PivotDateGrouping, (key: string) => string> = {
    year: (key) => key,
    week: (key) => key,
    quarter: (key) => key.replace(/^(\d{4})-(Q\d)$/u, '$2 $1'),
    month: (key) =>
      new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
        new Date(`${key}-01T00:00:00Z`),
      ),
    day: (key) =>
      new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
        new Date(`${key}T00:00:00Z`),
      ),
  };

  const groupText = (fieldList: readonly (keyof R & string)[], depth: number, key: string): string => {
    const field = fieldList[depth];
    if (key === '') return blankLabel;
    if (field === undefined) return key;
    if (formatGroup !== undefined) return formatGroup(field, key);
    const grouping = config.dateGrouping?.[field];
    return grouping === undefined ? key : dateFormats[grouping](key);
  };

  const headText = (cell: PivotHeaderCell): string => {
    if (cell.kind === 'total') return totalLabel;
    if (cell.kind === 'value') return measureLabels[cell.value ?? 0] ?? '';
    return cell.group === undefined
      ? ''
      : groupText(config.columns, cell.group.depth, cell.group.key);
  };

  const rowText = (row: PivotBodyRow): string =>
    row.group === undefined ? totalLabel : groupText(config.rows, row.group.depth, row.group.key);

  const cellValue = (cell: PivotDataCell): { text: string; amount: number } | undefined => {
    const amount = result.cell(cell.rowPath, cell.colPath, cell.value);
    const format = formats[cell.value];
    return amount === undefined || format === undefined
      ? undefined
      : { amount, text: format.format(amount) };
  };

  const toggle = (path: readonly string[]): void => {
    const id = pathId(path);
    if (collapsed.has(id)) collapsed.delete(id);
    else collapsed.add(id);
  };

  const corner = $derived(config.rows.map(labelOf).join(' / '));
  const empty = $derived(data.length === 0 || config.values.length === 0);
</script>

<div {...rest} class={['flex flex-col gap-4', className]}>
  {#if configurable}
    <PivotFields
      bind:config
      {fields}
      labels={{ ...defaultPivotFieldsLabels, ...fieldsLabels }}
      {measureText}
      {aggregateLabels}
    />
  {/if}
  <div class="overflow-x-auto">
    <table class="table-sm table w-auto">
      <caption class="text-start font-semibold">{caption}</caption>
      <PivotHead head={layout.head} {corner} text={headText} />
      <tbody>
        {#if empty}
          <tr><td colspan={layout.width + 1} class="text-base-content/60">{emptyLabel}</td></tr>
        {:else}
          {#each layout.body as row (row.id)}
            <PivotRow
              {row}
              label={rowText(row)}
              width={layout.width}
              value={cellValue}
              ontoggle={() => row.group && toggle(row.group.path)}
            />
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
