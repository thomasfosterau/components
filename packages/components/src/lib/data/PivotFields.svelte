<!--
  PivotFields — `PivotTable`'s configurator: a fieldset per zone (rows,
  columns, values, unplaced fields), each field a menu button whose menu
  moves, reorders or removes it, and sets a measure's aggregate. Every
  change is read out in a polite status region as the whole layout.
-->
<script lang="ts" generics="R">
  import PivotFieldMenu from './PivotFieldMenu.svelte';
  import type { PivotConfig, PivotValue } from './pivot.ts';
  import {
    addToZone,
    isBuiltInAggregate,
    pivotAggregates,
    removeFromZone,
    setAggregate,
    shiftInZone,
    unplacedFields,
    type PivotBuiltInAggregate,
    type PivotField,
    type PivotFieldAction,
    type PivotFieldsLabels,
    type PivotZone,
  } from './pivot-fields.ts';

  interface Props {
    config: PivotConfig<R>;
    fields: readonly PivotField<R>[];
    labels: PivotFieldsLabels;
    /** A measure's header text. */
    measureText: (value: PivotValue<R>) => string;
    aggregateLabels: Readonly<Record<PivotBuiltInAggregate, string>>;
  }

  let { config = $bindable(), fields, labels, measureText, aggregateLabels }: Props = $props();

  let announcement = $state('');

  const fieldOf = (name: string): PivotField<R> | undefined =>
    fields.find((field) => field.name === name);
  const labelOf = (name: string): string => fieldOf(name)?.label ?? name;
  const listText = (items: readonly string[]): string =>
    items.length === 0 ? labels.none : items.join(', ');

  const change = (next: PivotConfig<R>): void => {
    config = next;
    announcement = labels.summary(
      listText(next.rows.map(labelOf)),
      listText(next.columns.map(labelOf)),
      listText(next.values.map(measureText)),
    );
  };

  const placed = $derived([
    {
      zone: 'rows' as const,
      items: config.rows.map((name) => ({ name, text: labelOf(name) })),
    },
    {
      zone: 'columns' as const,
      items: config.columns.map((name) => ({ name, text: labelOf(name) })),
    },
    {
      zone: 'values' as const,
      items: config.values.map((value) => ({ name: value.field, text: measureText(value) })),
    },
  ]);
  const others = $derived(unplacedFields(config, fields));
  const zones = ['rows', 'columns', 'values'] as const;

  /** Moves to the other axis, adds to values, and reorders. */
  const actionsFor = (
    zone: PivotZone,
    index: number,
    count: number,
    name: string,
  ): PivotFieldAction[] => {
    const field = fieldOf(name);
    const moves: PivotFieldAction[] =
      zone === 'values' || field === undefined
        ? []
        : [
            {
              label: labels.moveTo(labels[zone === 'rows' ? 'columns' : 'rows']),
              run: () =>
                change(
                  addToZone(
                    removeFromZone(config, zone, index),
                    field,
                    zone === 'rows' ? 'columns' : 'rows',
                  ),
                ),
            },
            {
              label: labels.addTo(labels.values),
              run: () => change(addToZone(config, field, 'values')),
            },
          ];
    return [
      ...moves,
      {
        label: labels.moveUp,
        disabled: index === 0,
        run: () => change(shiftInZone(config, zone, index, -1)),
      },
      {
        label: labels.moveDown,
        disabled: index === count - 1,
        run: () => change(shiftInZone(config, zone, index, 1)),
      },
    ];
  };

  const aggregateChoice = (index: number) => {
    const agg = config.values[index]?.agg;
    return {
      label: labels.aggregate,
      value: isBuiltInAggregate(agg) ? agg : '',
      options: pivotAggregates.map((value) => ({ value, label: aggregateLabels[value] })),
      change: (next: string) => {
        if (isBuiltInAggregate(next)) change(setAggregate(config, index, next));
      },
    };
  };
</script>

<div role="group" aria-label={labels.configurator} class="flex flex-wrap gap-4">
  {#each placed as { zone, items } (zone)}
    <fieldset class="fieldset min-w-40">
      <legend class="fieldset-legend">{labels[zone]}</legend>
      {#if items.length === 0}
        <p class="text-base-content/60 text-sm">{labels.none}</p>
      {:else}
        <ul class="flex flex-wrap gap-2">
          {#each items as item, index (`${item.name}-${index}`)}
            <li>
              <PivotFieldMenu
                text={item.text}
                menuLabel={labels.options(item.text)}
                actions={actionsFor(zone, index, items.length, item.name)}
                choice={zone === 'values' ? aggregateChoice(index) : undefined}
                remove={{ label: labels.remove, run: () => change(removeFromZone(config, zone, index)) }}
              />
            </li>
          {/each}
        </ul>
      {/if}
    </fieldset>
  {/each}
  {#if others.length > 0}
    <fieldset class="fieldset min-w-40">
      <legend class="fieldset-legend">{labels.fields}</legend>
      <ul class="flex flex-wrap gap-2">
        {#each others as field (field.name)}
          <li>
            <PivotFieldMenu
              text={field.label}
              menuLabel={labels.options(field.label)}
              unplaced
              actions={zones.map((zone) => ({
                label: labels.addTo(labels[zone]),
                run: () => change(addToZone(config, field, zone)),
              }))}
            />
          </li>
        {/each}
      </ul>
    </fieldset>
  {/if}
  <p role="status" class="sr-only">{announcement}</p>
</div>
