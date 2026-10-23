<!-- @component
A number, or a `[low, high]` range, picked from a bounded, stepped scale by dragging or with the arrow keys, on bits-ui's `Slider`.
-->
<!--
  Slider — one component, two modes. `type="single"` binds a `number`;
  `type="multiple"` binds a `number[]` with one thumb per entry. Built on
  bits-ui's `Slider` (pointer drag, arrow / Home / End keys, non-crossing
  thumbs) and wired through the `FieldControl` contract like every other
  control in `fields/`.

  Why not `TextInput type="range"` or daisyUI's `range` on a native input: a
  native range has one thumb, no ticks and no consistent value readout, and
  the keyboard model across two thumbs is exactly what AGENTS.md reserves for
  bits-ui. The daisyUI `range` CLASSES are still the colour and size
  vocabulary: `rangeTone` sets `color` (the fill, read as `currentColor`) and
  `--range-thumb` (the thumb face), and `rangeSize` sets `--range-thumb-size`,
  which the thumb and the track are sized from. The `range` class itself is
  not used — it styles a native input's pseudo-elements.

  ARIA contract (APG slider and multi-thumb slider): every thumb is
  `role="slider"` with `aria-valuemin/max/now` and `aria-orientation` from
  bits-ui. This file adds `aria-valuetext` from `formatValue`, the accessible
  name, `aria-describedby` / `aria-invalid` from `FieldControl`, Page Up /
  Page Down (bits-ui 2.20 handles only the arrows, Home and End; a page is a
  tenth of the scale, at least one step), and one hidden `<input>` per thumb
  under `name`, so a plain form posts the value.

  Naming: a `<label for>` cannot name a `role="slider"` span, so the `id` goes
  on the first thumb (the second is `${id}-1`) and the name comes from
  `aria-labelledby={labelId}` — the visible label's id, which `FormField`
  hands its control as `FieldControl.labelId` (#179). In range mode each
  thumb is labelled by the label AND itself (`aria-labelledby="label thumb"`
  with `aria-label` = its `thumbLabels` entry), so the second thumb reads
  "Hours of sun Maximum". Outside a `FormField`, pass `label` instead; it
  becomes the thumbs' `aria-label`.

  The visible readout is `aria-hidden`: the same text is each thumb's
  `aria-valuetext`, and announcing it twice would be noise.

  Known limitation: bits-ui 2.20 gives every thumb the slider's global
  `aria-valuemin` / `aria-valuemax` rather than its neighbour's value, so in
  range mode a thumb over-reports how far it can move (it still cannot cross:
  `autoSort` is left on). Not hand-patched, so a bits-ui fix lands for free.

  `required` is accepted so `{...control}` spreads cleanly, but a slider
  always has a value, so it changes nothing.
-->
<script lang="ts">
  import { Slider } from 'bits-ui';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { rangeTone, type Tone } from '../ui/tones.ts';
  import { rangeSize, type FieldSize } from './field-types.ts';
  import { clampToNeighbours, pageStep } from './slider-keys.ts';

  interface SliderBaseProps
    extends Omit<HTMLAttributes<HTMLSpanElement>, 'dir' | 'onchange' | 'children'> {
    /**
     * The lowest value.
     * @defaultValue `0`
     */
    min?: number | undefined;
    /**
     * The highest value.
     * @defaultValue `100`
     */
    max?: number | undefined;
    /**
     * Increment between values; an array gives explicit snap points.
     * @defaultValue `1`
     */
    step?: number | readonly number[] | undefined;
    /**
     * Track direction.
     * @defaultValue `'horizontal'`
     */
    orientation?: 'horizontal' | 'vertical' | undefined;
    /**
     * Draw a tick per step.
     * @defaultValue `false`
     */
    ticks?: boolean | undefined;
    /** Format a value for each thumb's `aria-valuetext` and the visible readout, e.g. `(v) => \`${v} cm\``. Falls back to `Intl.NumberFormat(locales)`. */
    formatValue?: ((value: number) => string) | undefined;
    /** BCP 47 locale(s) for the default formatter; falls back to the context's `locale()`. */
    locales?: string | readonly string[] | undefined;
    /**
     * Show the formatted value(s) beside the track.
     * @defaultValue `true`
     */
    showValue?: boolean | undefined;
    /**
     * Accessible name of each thumb in range mode, in order.
     * @defaultValue `['Minimum', 'Maximum']`
     */
    thumbLabels?: readonly string[] | undefined;
    /** Fired once per finished interaction (pointer-up, or a key press), for work that should not run per pixel. */
    onCommit?: ((value: number | readonly number[]) => void) | undefined;
    /** Posts the value under this name: one hidden input per thumb. */
    name?: string | undefined;
    /**
     * Disables every thumb (and the hidden inputs, so nothing posts).
     * @defaultValue `false`
     */
    disabled?: boolean | undefined;
    /**
     * daisyUI tone of the fill and thumbs; `invalid` overrides it with `error`.
     * @defaultValue `'primary'`
     */
    tone?: Tone | undefined;
    /**
     * daisyUI size step (the thumb diameter; the track is half of it).
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** Accessible name, for a slider outside a `FormField`; ignored when `labelId` is set. */
    label?: string | undefined;
    /** `FieldControl`: the first thumb's `id` (the others are `${id}-1`, …). Minted when omitted. */
    id?: string | undefined;
    /** `FieldControl`: the visible label's id; every thumb is `aria-labelledby` it. */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for each thumb's `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the field is in error — sets `aria-invalid` and the `error` tone.
     * @defaultValue `false`
     */
    invalid?: boolean | undefined;
    /** `FieldControl`: accepted for the spread; a slider always has a value, so it has no effect. */
    required?: boolean | undefined;
  }

  type Props =
    | (SliderBaseProps & {
        /**
         * One thumb, binding a `number`.
         * @defaultValue `'single'`
         */
        type?: 'single' | undefined;
        /** The value. Bindable; defaults to `min`. */
        value?: number | undefined;
      })
    | (SliderBaseProps & {
        /** One thumb per entry of `value`, binding a `number[]`. */
        type: 'multiple';
        /** The values, low to high. Bindable; defaults to `[min, max]`. */
        value?: number[] | undefined;
      });

  let {
    type = 'single',
    value = $bindable(),
    min = 0,
    max = 100,
    step = 1,
    orientation = 'horizontal',
    ticks = false,
    formatValue,
    locales = getComponentsContext().locale(),
    showValue = true,
    thumbLabels = ['Minimum', 'Maximum'],
    onCommit,
    name,
    disabled = false,
    tone = 'primary',
    size = 'md',
    label,
    id: idProp,
    labelId,
    describedBy = '',
    invalid = false,
    required: _required = false,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const id = $derived(idProp ?? uid);
  const multiple = $derived(type === 'multiple');
  const vertical = $derived(orientation === 'vertical');

  /** The bound value, normalised to one entry per thumb. */
  const values = $derived.by((): readonly number[] => {
    if (multiple) return Array.isArray(value) ? value : [min, max];
    return [typeof value === 'number' ? value : min];
  });

  const numberFormat = $derived(new Intl.NumberFormat(locales as string | string[] | undefined));
  const format = $derived(formatValue ?? ((n: number) => numberFormat.format(n)));
  const readout = $derived(values.map((n) => format(n)).join(' – '));

  // bits-ui wants a mutable array; ours is readonly at the API.
  const steps = $derived(typeof step === 'number' ? step : [...step]);

  /** What both `Slider.Root` branches share; only `type` and the bound value differ. */
  const rootProps = $derived({
    onValueCommit: commit,
    min,
    max,
    step: steps,
    orientation,
    disabled,
    class: [
      'relative flex touch-none items-center select-none data-[disabled]:opacity-30',
      vertical ? 'h-full w-(--range-thumb-size) flex-col' : 'h-(--range-thumb-size) w-full',
    ],
  });

  function thumbId(index: number): string {
    return index === 0 ? id : `${id}-${index}`;
  }

  function thumbLabel(index: number): string {
    return thumbLabels[index] ?? `${index + 1}`;
  }

  function ariaLabel(index: number): string | undefined {
    if (labelId !== undefined) return multiple ? thumbLabel(index) : undefined;
    if (!multiple) return label;
    return label === undefined ? thumbLabel(index) : `${label} ${thumbLabel(index)}`;
  }

  function ariaLabelledBy(index: number): string | undefined {
    if (labelId === undefined) return undefined;
    return multiple ? `${labelId} ${thumbId(index)}` : labelId;
  }

  function commit(next: number | readonly number[]): void {
    onCommit?.(next);
  }

  /** Page Up / Page Down: a tenth of the scale (at least one step), clamped between the neighbouring thumbs. */
  function onThumbKeydown(event: KeyboardEvent, index: number): void {
    if (disabled || (event.key !== 'PageUp' && event.key !== 'PageDown')) return;
    event.preventDefault();
    const scale = { min, max, step };
    const current = values[index] ?? min;
    const next = clampToNeighbours(
      values,
      index,
      pageStep(current, event.key === 'PageUp' ? 1 : -1, scale),
      scale,
    );
    if (next === current) return;
    const updated = values.map((n, i) => (i === index ? next : n));
    value = multiple ? updated : next;
    commit(multiple ? updated : next);
  }
</script>

{#snippet parts({
  thumbItems,
  tickItems,
}: {
  thumbItems: { index: number }[];
  tickItems: { index: number }[];
})}
  <span
    class={[
      'relative grow overflow-hidden rounded-full bg-base-300',
      vertical ? 'h-full w-[calc(var(--range-thumb-size)*0.5)]' : 'h-[calc(var(--range-thumb-size)*0.5)] w-full',
    ]}
  >
    <Slider.Range class={['bg-current', vertical ? 'w-full' : 'h-full']} />
  </span>
  {#if ticks}
    {#each tickItems as { index } (index)}
      <Slider.Tick {index} class="size-1 rounded-full bg-base-content/30" />
    {/each}
  {/if}
  {#each thumbItems as { index } (index)}
    <Slider.Thumb
      {index}
      id={thumbId(index)}
      aria-label={ariaLabel(index)}
      aria-labelledby={ariaLabelledBy(index)}
      aria-valuetext={format(values[index] ?? min)}
      aria-describedby={describedBy === '' ? undefined : describedBy}
      aria-invalid={invalid ? 'true' : undefined}
      onkeydown={(event: KeyboardEvent) => onThumbKeydown(event, index)}
      class="size-(--range-thumb-size) cursor-grab rounded-full border-4 border-current bg-(--range-thumb) shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current data-[active]:cursor-grabbing data-[disabled]:cursor-not-allowed"
    />
  {/each}
{/snippet}

<span
  {...rest}
  class={[
    'inline-flex items-center gap-3',
    vertical ? 'h-48 flex-col' : 'w-full',
    rangeTone[invalid ? 'error' : tone],
    rangeSize[size],
    className,
  ]}
>
  {#if multiple}
    <Slider.Root
      type="multiple"
      bind:value={
        () => [...values],
        (next: number[]) => {
          value = next;
        }
      }
      {...rootProps}
    >
      {#snippet children(snippetProps)}{@render parts(snippetProps)}{/snippet}
    </Slider.Root>
  {:else}
    <Slider.Root
      type="single"
      bind:value={
        () => values[0] ?? min,
        (next: number) => {
          value = next;
        }
      }
      {...rootProps}
    >
      {#snippet children(snippetProps)}{@render parts(snippetProps)}{/snippet}
    </Slider.Root>
  {/if}
  {#if showValue}
    <span aria-hidden="true" class="text-sm whitespace-nowrap text-base-content tabular-nums">{readout}</span>
  {/if}
  {#if name !== undefined}
    {#each values as entry, index (index)}
      <input type="hidden" {name} value={entry} {disabled} />
    {/each}
  {/if}
</span>
