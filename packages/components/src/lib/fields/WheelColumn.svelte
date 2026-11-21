<!-- @component
One column of a `WheelPicker`: a `role="spinbutton"` over a scroll-snapping list of options.
-->
<!--
  WheelColumn — the column is the spinbutton; the rows inside are
  `aria-hidden`, so a screen reader hears "Hours, 7" rather than sixty
  minutes. The list snaps with CSS scroll-snap and commits on `scrollend`
  (or a short pause in `scroll`, where `scrollend` is missing).
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    edgeIndex,
    nearestEnabled,
    numericRange,
    rowAt,
    typeaheadIndex,
    wheelKeyTarget,
    type WheelColumnDef,
  } from './wheel.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    column: WheelColumnDef;
    /** The selected option's value. Bindable. */
    value?: string | undefined;
    /**
     * Visible rows, odd so one sits in the middle.
     * @defaultValue `5`
     */
    visibleRows?: 3 | 5 | 7 | undefined;
    /** @defaultValue `false` */
    disabled?: boolean | undefined;
    /** Marks the spinbutton `aria-invalid`. */
    invalid?: boolean | undefined;
    /** Called with each committed value. */
    onValueChange?: ((value: string) => void) | undefined;
  }

  let {
    column,
    value = $bindable(),
    visibleRows = 5,
    disabled = false,
    invalid = false,
    onValueChange,
    class: className,
    ...rest
  }: Props = $props();

  let list: HTMLDivElement | null = $state(null);
  let rowHeight = 0;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let typed = '';
  let typedTimer: ReturnType<typeof setTimeout> | undefined;

  const found = $derived(column.options.findIndex((option) => option.value === value));
  const index = $derived(found === -1 ? Math.max(edgeIndex(column.options, 1), 0) : found);
  const selected = $derived(column.options[index]);
  const range = $derived(numericRange(column.options, selected?.value ?? ''));

  const reducedMotion = (): boolean =>
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const measure = (): number => {
    const row = list?.querySelector<HTMLElement>('[data-index]');
    rowHeight = row?.offsetHeight ?? rowHeight;
    return rowHeight;
  };

  const scrollTo = (target: number, smooth: boolean): void => {
    if (!list) return;
    const top = target * measure();
    if (Math.abs(list.scrollTop - top) < 1) return;
    list.scrollTo({ top, behavior: smooth && !reducedMotion() ? 'smooth' : 'auto' });
  };

  const commit = (target: number, smooth = true): void => {
    const option = column.options[target];
    if (option === undefined || option.disabled === true) return;
    scrollTo(target, smooth);
    if (option.value === value) return;
    value = option.value;
    onValueChange?.(option.value);
  };

  /** Reads the snapped row once scrolling stops, skipping a disabled one. */
  const settle = (): void => {
    clearTimeout(settleTimer);
    if (!list || disabled) return;
    const target = nearestEnabled(
      column.options,
      rowAt(list.scrollTop, measure(), column.options.length),
    );
    if (target !== -1) commit(target);
  };

  const onscroll = (): void => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 150);
  };

  const typeahead = (key: string): number => {
    clearTimeout(typedTimer);
    typed += key;
    typedTimer = setTimeout(() => (typed = ''), 600);
    const match = typeaheadIndex(column.options, typed.length > 1 ? index - 1 : index, typed);
    return match === -1 ? typeaheadIndex(column.options, index, key) : match;
  };

  const onkeydown = (event: KeyboardEvent): void => {
    const target = disabled ? undefined : wheelKeyTarget(column.options, index, event, column.loop);
    if (target === undefined) return;
    event.preventDefault();
    commit(target === 'type' ? typeahead(event.key) : target);
  };

  const onclick = (event: MouseEvent): void => {
    if (disabled || !(event.target instanceof Element)) return;
    const row = event.target.closest<HTMLElement>('[data-index]');
    if (row) commit(Number(row.dataset['index']));
  };

  $effect(() => () => {
    clearTimeout(settleTimer);
    clearTimeout(typedTimer);
  });

  // Keeps the list on the selected row when the value changes from outside.
  $effect(() => {
    const target = index;
    if (list) scrollTo(target, false);
  });
</script>

<div
  {...rest}
  role="spinbutton"
  tabindex={disabled ? -1 : 0}
  aria-label={column.label}
  aria-valuetext={selected?.label}
  aria-valuenow={range?.now}
  aria-valuemin={range?.min}
  aria-valuemax={range?.max}
  aria-disabled={disabled || undefined}
  aria-invalid={invalid || undefined}
  class={[
    'focus-visible:outline-primary relative rounded-field focus-visible:outline-2 focus-visible:outline-offset-2',
    disabled && 'opacity-50',
    className,
  ]}
  style:--wheel-rows={visibleRows}
  {onkeydown}
  {onclick}
>
  <div
    bind:this={list}
    aria-hidden="true"
    class="overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    style:overflow-y="scroll"
    style:box-sizing="border-box"
    style:height="calc(var(--wheel-row) * {visibleRows})"
    style:scroll-snap-type="y mandatory"
    style:padding-block="calc(var(--wheel-row) * {(visibleRows - 1) / 2})"
    style:mask-image="linear-gradient(transparent, black 35%, black 65%, transparent)"
    {onscroll}
    onscrollend={settle}
  >
    {#each column.options as option, at (option.value)}
      <div
        data-index={at}
        class={[
          'grid cursor-default place-items-center px-3 tabular-nums select-none',
          at === index ? 'text-base-content font-medium' : 'text-base-content/50',
          option.disabled && 'line-through opacity-40',
        ]}
        style:height="var(--wheel-row)"
        style:scroll-snap-align="center"
      >
        {option.label}
      </div>
    {/each}
  </div>
</div>

