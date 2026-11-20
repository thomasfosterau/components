<!-- @component
A round dial for an angle or bearing (a bed's aspect, wind direction, rotation): drag anywhere on it, or use the arrow keys; it wraps from 359° to 0°.
-->
<!--
  Hand-rolled: bits-ui has no circular slider, and the contract is the APG
  slider with wrapping. The thumb is the `role="slider"`; clockwise is
  "increase" whatever way 0° points or the text runs. Disabled stays
  focusable (`aria-disabled`), as `Slider` does. Pair it with a
  `NumberField` for typed entry.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { textTone, type Tone } from '../ui/tones.ts';
  import {
    angleToPoint,
    angleToValue,
    compass8,
    compass16,
    compassName,
    nearestMark,
    pointToAngle,
    stepBy,
    type AngleScale,
    type AngleZero,
  } from './angle.ts';

  /** A tick on the dial, optionally labelled. */
  interface AngleMark {
    readonly value: number;
    readonly label?: string | undefined;
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /**
     * Degrees. Bindable.
     * @defaultValue `min`
     */
    value?: number | undefined;
    /** @defaultValue `0` */
    min?: number | undefined;
    /** @defaultValue `360` */
    max?: number | undefined;
    /** @defaultValue `1` */
    step?: number | undefined;
    /**
     * Stepping past one end continues from the other.
     * @defaultValue `true` when the range is a full circle
     */
    wrap?: boolean | undefined;
    /**
     * Where 0° points: up, as a compass bearing, or right.
     * @defaultValue `'north'`
     */
    zero?: AngleZero | undefined;
    /** Ticks, optionally labelled, at these values. */
    marks?: readonly AngleMark[] | undefined;
    /**
     * Compass marks (N, E, S, W) and the compass point in the value text.
     * @defaultValue `false`
     */
    compass?: boolean | undefined;
    /**
     * How many compass points the value text names.
     * @defaultValue `8`
     */
    compassPoints?: 8 | 16 | undefined;
    /** The compass point names, north first and clockwise; overrides the English ones. */
    compassLabels?: readonly string[] | undefined;
    /**
     * The four compass marks' labels, north first.
     * @defaultValue `['N', 'E', 'S', 'W']`
     */
    compassMarkLabels?: readonly [string, string, string, string] | undefined;
    /**
     * Only the marks can be chosen.
     * @defaultValue `false`
     */
    restrictToMarks?: boolean | undefined;
    /**
     * The visible readout.
     * @defaultValue `` (v) => `${v}°` ``
     */
    formatValue?: ((value: number) => string) | undefined;
    /**
     * The slider's `aria-valuetext`; "degrees" spelled out, as screen readers read "°" unevenly.
     * @defaultValue `` `${v} degrees` ``, then the compass point in compass mode
     */
    formatValueText?: ((value: number) => string) | undefined;
    /** Called on every change. */
    onValueChange?: ((value: number) => void) | undefined;
    /** Called once a change is finished: pointer up, or each key press. */
    onCommit?: ((value: number) => void) | undefined;
    /** Posts the value under this name. */
    name?: string | undefined;
    /** Unavailable, but still focusable so it can be found. */
    disabled?: boolean | undefined;
    /** @defaultValue `'md'` */
    size?: 'sm' | 'md' | 'lg' | undefined;
    /**
     * The arc's colour; `invalid` overrides it with `error`.
     * @defaultValue `'primary'`
     */
    tone?: Tone | undefined;
    /** `FieldControl`: the thumb's id. */
    id?: string | undefined;
    /** `FieldControl`: the label's id; names the slider through `aria-labelledby`. */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /** `FieldControl`: the field is in error. */
    invalid?: boolean | undefined;
    /** `FieldControl`: taken so a spread does not leak it; a slider always has a value. */
    required?: boolean | undefined;
  }

  let {
    min = 0,
    max = 360,
    value = $bindable(min),
    step = 1,
    wrap,
    zero = 'north',
    marks = [],
    compass = false,
    compassPoints = 8,
    compassLabels,
    compassMarkLabels = ['N', 'E', 'S', 'W'],
    restrictToMarks = false,
    formatValue = (degrees) => `${degrees}°`,
    formatValueText,
    onValueChange,
    onCommit,
    name,
    disabled = false,
    size = 'md',
    tone = 'primary',
    id: idProp,
    labelId,
    describedBy = '',
    invalid = false,
    required: _required,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const id = $derived(idProp ?? uid);

  const pixels: Record<NonNullable<Props['size']>, number> = { sm: 128, md: 160, lg: 208 };
  const side = $derived(pixels[size]);

  const scale = $derived<AngleScale>({ min, max, step, wrap: wrap ?? max - min >= 360 });
  const names = $derived(compassLabels ?? (compassPoints === 16 ? compass16 : compass8));

  const allMarks = $derived<readonly AngleMark[]>([
    ...(compass
      ? [0, 90, 180, 270].map((at, index) => ({ value: at, label: compassMarkLabels[index] }))
      : []),
    ...marks,
  ]);
  const markValues = $derived(allMarks.map((mark) => mark.value));

  const valueText = $derived(
    formatValueText?.(value) ??
      (compass ? `${value} degrees, ${compassName(value, names)}` : `${value} degrees`),
  );

  const set = (next: number): void => {
    const chosen = restrictToMarks && markValues.length > 0 ? nearestMark(next, markValues) : next;
    if (chosen === value) return;
    value = chosen;
    onValueChange?.(chosen);
  };

  /** Dial geometry, in the SVG's 0–100 box. */
  const centre = 50;
  const ring = 36;
  const at = (degrees: number, radius: number): { x: number; y: number } => {
    const point = angleToPoint(degrees, zero, radius);
    return { x: centre + point.x, y: centre + point.y };
  };

  const arc = $derived.by(() => {
    const sweep = value - min;
    if (sweep <= 0) return '';
    const start = at(min, ring);
    const end = at(value, ring);
    const large = sweep > 180 ? 1 : 0;
    if (sweep >= 360) return `M${start.x} ${start.y}A${ring} ${ring} 0 1 1 ${start.x - 0.01} ${start.y}`;
    return `M${start.x} ${start.y}A${ring} ${ring} 0 ${large} 1 ${end.x} ${end.y}`;
  });
  const thumb = $derived(at(value, ring));

  let dial: HTMLDivElement | undefined = $state();
  let thumbElement: HTMLDivElement | undefined = $state();
  let dragging: number | undefined;

  const fromPointer = (event: PointerEvent): number => {
    const rect = dial?.getBoundingClientRect();
    if (rect === undefined) return value;
    const angle = pointToAngle(
      event.clientX - rect.left - rect.width / 2,
      event.clientY - rect.top - rect.height / 2,
      zero,
    );
    return angleToValue(angle, scale);
  };

  const onpointerdown = (event: PointerEvent & { currentTarget: HTMLDivElement }): void => {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging = event.pointerId;
    thumbElement?.focus();
    set(fromPointer(event));
  };

  const onpointermove = (event: PointerEvent): void => {
    if (event.pointerId === dragging) set(fromPointer(event));
  };

  const onpointerup = (event: PointerEvent): void => {
    if (event.pointerId !== dragging) return;
    dragging = undefined;
    onCommit?.(value);
  };

  const pageDelta = $derived(step * Math.max(1, Math.round(15 / step)));
  const keys: Record<string, () => number> = {
    ArrowRight: () => stepBy(value, step, scale),
    ArrowUp: () => stepBy(value, step, scale),
    ArrowLeft: () => stepBy(value, -step, scale),
    ArrowDown: () => stepBy(value, -step, scale),
    PageUp: () => stepBy(value, pageDelta, scale),
    PageDown: () => stepBy(value, -pageDelta, scale),
    Home: () => min,
    End: () => max,
  };

  /** With `restrictToMarks`, a key moves to the next mark that way rather than by a step. */
  const markToward = (direction: number): number | undefined => {
    const sorted = markValues.toSorted((a, b) => a - b);
    const next =
      direction > 0 ? sorted.find((mark) => mark > value) : sorted.findLast((mark) => mark < value);
    return next ?? (scale.wrap ? (direction > 0 ? sorted[0] : sorted.at(-1)) : undefined);
  };

  const onkeydown = (event: KeyboardEvent): void => {
    const target = keys[event.key];
    if (target === undefined) return;
    event.preventDefault();
    if (disabled) return;
    const next = target();
    const marked =
      restrictToMarks && markValues.length > 0 && event.key.startsWith('Arrow')
        ? markToward(next - value)
        : next;
    set(marked ?? value);
    onCommit?.(value);
  };

  const markLabels = $derived(
    allMarks.flatMap((mark) =>
      mark.label === undefined ? [] : [{ ...at(mark.value, 46), label: mark.label }],
    ),
  );
</script>

<div
  {...rest}
  bind:this={dial}
  class={['relative shrink-0 select-none', disabled && 'opacity-50', className]}
  style:width="{side}px"
  style:height="{side}px"
  style:position="relative"
  style:touch-action="none"
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  onpointercancel={onpointerup}
>
  <svg viewBox="0 0 100 100" aria-hidden="true" class="absolute inset-0 size-full overflow-visible">
    <circle cx={centre} cy={centre} r={ring} fill="none" class="stroke-base-300" stroke-width="4" />
    {#each allMarks as mark (mark.value)}
      {@const inner = at(mark.value, ring - 5)}
      {@const outer = at(mark.value, ring - 2)}
      <line
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        class="stroke-base-content/40"
        stroke-width="1"
      />
    {/each}
    <path
      d={arc}
      fill="none"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
      class={textTone[invalid ? 'error' : tone]}
    />
    {#each markLabels as mark (mark.label)}
      <text
        x={mark.x}
        y={mark.y}
        text-anchor="middle"
        dominant-baseline="central"
        class="fill-base-content/70 text-[7px]">{mark.label}</text
      >
    {/each}
  </svg>
  <span
    aria-hidden="true"
    class="absolute inset-0 flex items-center justify-center text-sm tabular-nums"
  >
    {formatValue(value)}
  </span>
  <div
    bind:this={thumbElement}
    {id}
    role="slider"
    tabindex="0"
    aria-labelledby={labelId}
    aria-describedby={describedBy === '' ? undefined : describedBy}
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-valuetext={valueText}
    aria-disabled={disabled ? 'true' : undefined}
    aria-invalid={invalid ? 'true' : undefined}
    class={[
      'bg-base-100 focus-visible:outline-primary absolute size-6 rounded-full border-2 shadow focus-visible:outline-2 focus-visible:outline-offset-2',
      textTone[invalid ? 'error' : tone],
    ]}
    style:position="absolute"
    style:left="{thumb.x}%"
    style:top="{thumb.y}%"
    style:width="24px"
    style:height="24px"
    style:transform="translate(-50%, -50%)"
    {onkeydown}
  ></div>
</div>
{#if name !== undefined}
  <input type="hidden" {name} value={value} />
{/if}
