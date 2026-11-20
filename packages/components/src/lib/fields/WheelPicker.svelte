<!-- @component
Scrolling wheel columns for a compact multi-part value (hours | minutes, quantity | unit): touch-first, each column a spinbutton.
-->
<!--
  WheelPicker — a `role="group"` of `WheelColumn` spinbuttons, named by the
  `FormField` label through `labelId` (or `label`). A highlight band marks
  the centre row. With `name`, each column posts as `name[id]`, or the
  whole value once through `serialize`.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import WheelColumn from './WheelColumn.svelte';
  import { edgeIndex, type WheelColumnDef, type WheelValue } from './wheel.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'children'> {
    columns: readonly WheelColumnDef[];
    /** Selected value per column id. Bindable. */
    value?: WheelValue | undefined;
    /**
     * Visible rows per column.
     * @defaultValue `5`
     */
    visibleRows?: 3 | 5 | 7 | undefined;
    /** Text between columns: `separators[0]` sits between the first two (":" for a time). */
    separators?: readonly string[] | undefined;
    /** Posts each column as `name[id]`, or one value through `serialize`. */
    name?: string | undefined;
    serialize?: ((value: WheelValue) => string) | undefined;
    /** @defaultValue `false` */
    disabled?: boolean | undefined;
    /** Called with the whole value after any column changes. */
    onValueChange?: ((value: WheelValue) => void) | undefined;
    /** Names the group outside a `FormField`. */
    label?: string | undefined;
    /** From `FormField`: the visible label's id, which names the group. */
    labelId?: string | undefined;
    describedBy?: string | undefined;
    invalid?: boolean | undefined;
    /** Accepted so `{...control}` spreads; a wheel always has a value. */
    required?: boolean | undefined;
  }

  let {
    columns,
    value = $bindable(),
    visibleRows = 5,
    separators = [],
    name,
    serialize,
    disabled = false,
    onValueChange,
    label,
    labelId,
    describedBy,
    invalid,
    required: _required,
    class: className,
    ...rest
  }: Props = $props();

  /** What each column shows: its value, or its first enabled option. */
  const shown = $derived(
    Object.fromEntries(
      columns.map((column) => [
        column.id,
        value?.[column.id] ??
          column.options[Math.max(edgeIndex(column.options, 1), 0)]?.value ??
          '',
      ]),
    ),
  );

  const change = (id: string, next: string): void => {
    const whole = { ...shown, [id]: next };
    value = whole;
    onValueChange?.(whole);
  };
</script>

<div
  {...rest}
  role="group"
  aria-label={labelId === undefined ? label : undefined}
  aria-labelledby={labelId}
  aria-describedby={describedBy || undefined}
  class={['relative inline-flex w-fit items-center gap-1 self-start', className]}
  style:--wheel-row="2.5rem"
>
  <div
    aria-hidden="true"
    class="bg-base-200 rounded-field pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2"
    style:height="var(--wheel-row)"
  ></div>
  {#each columns as column, at (column.id)}
    {#if at > 0 && separators[at - 1]}
      <span aria-hidden="true" class="relative font-medium">{separators[at - 1]}</span>
    {/if}
    <WheelColumn
      {column}
      {visibleRows}
      {disabled}
      {invalid}
      value={shown[column.id]}
      onValueChange={(next) => change(column.id, next)}
    />
  {/each}
  {#if name !== undefined}
    {#if serialize}
      <input type="hidden" {name} value={serialize(shown)} />
    {:else}
      {#each columns as column (column.id)}
        <input type="hidden" name="{name}[{column.id}]" value={shown[column.id]} />
      {/each}
    {/if}
  {/if}
</div>
