<!-- @component
An exact number the reader types or nudges, shown locale-formatted (units, percent, currency) with − / + stepper buttons: the APG spinbutton.
-->
<!--
  NumberField — a `role="spinbutton"` text input showing its value through
  `Intl.NumberFormat`, plus − / + buttons, stepping clamped to `min` / `max`.

  Hand-rolled, and why that is acceptable here (AGENTS.md asks for the
  reason): bits-ui 2.20 has no number field, and the APG spinbutton pattern is
  one input plus two buttons — no popover, no roving focus, no ARIA
  relationship beyond `aria-controls` — so every part of the contract is
  small and pinned by `tests/fields/NumberField.test.ts`. It replaces the
  native `<input type="number">` for callers who need what that cannot do:
  locale formatting and parsing ("1.234,5" in `de-DE`), a `number` value
  rather than a string, no accidental scroll-wheel changes (there is no wheel
  handling at all), and stepper buttons that are labelled and styleable.

  Editing: while focused the input holds the text as typed. On blur or Enter
  it is parsed with the locale's separators (`number-format.ts`), clamped to
  `min` / `max`, rounded to the step's or the format's precision, written to
  `value`, re-formatted, and passed to `onCommit`. Unparseable text reverts
  to the last valid value; clearing the field commits `undefined`.

  ARIA contract (APG spinbutton): the input is `role="spinbutton"` with
  `aria-valuenow`, `aria-valuemin` / `aria-valuemax` when set, and
  `aria-valuetext` — the formatted string, so "45%" is read rather than
  "0.45" — plus `inputmode` (`numeric` when the format has no fraction
  digits, else `decimal`) and the `FieldControl` wiring. The − / + are real
  buttons named by `decrementLabel` / `incrementLabel`, `aria-controls` the
  input, `tabindex="-1"` so the field stays one tab stop, and disabled at the
  bounds. Keys: Arrow Up / Down ± `step`, Page Up / Down ± `largeStep`,
  Home / End to `min` / `max` (when set), Enter commits.

  Press-and-hold on − / + auto-repeats: one step on press, then after
  `REPEAT_DELAY_MS` it repeats, speeding up to `REPEAT_MIN_MS`, as GTK's spin
  button, WinUI's NumberBox and SwiftUI's Stepper do. The pointer is captured,
  so moving off the button keeps the capture and `pointerup` /
  `pointercancel` / `lostpointercapture` (or reaching a bound) stops it. A
  pointer press never moves focus off the input. A click with no pointer
  press before it (assistive technology activating the button) steps once.

  `name` posts the raw number through a hidden input, never the formatted
  text, so a server never parses "1.234,5 cm".
-->
<script lang="ts">
  import { Minus, Plus } from '@lucide/svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { inputButtonSize, inputSize, type FieldSize } from './field-types.ts';
  import {
    clamp,
    formatNumber,
    parseNumber,
    roundTo,
    valuePrecision,
    type NumberLocales,
  } from './number-format.ts';

  interface Props
    extends Omit<
      HTMLInputAttributes,
      'value' | 'type' | 'size' | 'min' | 'max' | 'step' | 'inputmode' | 'children'
    > {
    /** The number, or `undefined` while the field is empty. Bindable. */
    value?: number | undefined;
    /** The lowest value; also what Home goes to. */
    min?: number | undefined;
    /** The highest value; also what End goes to. */
    max?: number | undefined;
    /**
     * Increment for the buttons and the arrow keys.
     * @defaultValue `1`
     */
    step?: number | undefined;
    /**
     * Increment for Page Up / Page Down.
     * @defaultValue `step * 10`
     */
    largeStep?: number | undefined;
    /** How the value is displayed and parsed, e.g. `{ style: 'unit', unit: 'centimeter' }`, `{ style: 'percent' }`, `{ style: 'currency', currency: 'AUD' }`. */
    formatOptions?: Intl.NumberFormatOptions | undefined;
    /** BCP 47 locale(s) to format and parse in; falls back to the context's `locale()`. */
    locales?: NumberLocales;
    /**
     * Show the − / + buttons.
     * @defaultValue `true`
     */
    showStepper?: boolean | undefined;
    /**
     * Accessible name of the − button.
     * @defaultValue `'Decrease'`
     */
    decrementLabel?: string | undefined;
    /**
     * Accessible name of the + button.
     * @defaultValue `'Increase'`
     */
    incrementLabel?: string | undefined;
    /** Called with the committed number on blur, Enter or a step — not on every keystroke. */
    onCommit?: ((value: number | undefined) => void) | undefined;
    /** Posts the raw number (not the formatted text) under this name, through a hidden input. */
    name?: string | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /**
     * Disables the input and both buttons.
     * @defaultValue `false`
     */
    disabled?: boolean | undefined;
    /** `FieldControl`: the input's `id`, which `FormField`'s label points at. Minted when omitted. */
    id?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the visible label's id. Not used — the input is
     * labelable, so the `FormField`'s `<label for>` already names it; taken
     * here so a spread `FieldControl` does not leak it as an attribute.
     */
    labelId?: string | undefined;
    /**
     * `FieldControl`: the field is in error — sets `aria-invalid` and `input-error`.
     * @defaultValue `false`
     */
    invalid?: boolean | undefined;
  }

  /** How long a press is held before it starts repeating. */
  const REPEAT_DELAY_MS = 400;
  /** The first repeat interval; each repeat shortens it towards `REPEAT_MIN_MS`. */
  const REPEAT_START_MS = 150;
  const REPEAT_MIN_MS = 40;

  let {
    value = $bindable(),
    min,
    max,
    step = 1,
    largeStep,
    formatOptions,
    locales = getComponentsContext().locale(),
    showStepper = true,
    decrementLabel = 'Decrease',
    incrementLabel = 'Increase',
    onCommit,
    name,
    size = 'md',
    disabled = false,
    id: idProp,
    describedBy = '',
    labelId: _labelId,
    invalid = false,
    class: className,
    onkeydown,
    onblur,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const id = $derived(idProp ?? uid);
  const formatted = $derived(formatNumber(value, locales, formatOptions));
  /** The input's text: the formatted value, overwritten by typing until the next commit. */
  let text = $derived(formatted);
  const precision = $derived(valuePrecision(step, locales, formatOptions));
  const atMin = $derived(value !== undefined && min !== undefined && value <= min);
  const atMax = $derived(value !== undefined && max !== undefined && value >= max);

  let input = $state<HTMLInputElement | null>(null);
  let repeat: ReturnType<typeof setTimeout> | undefined;

  /** Write a new value: clamp, round, re-format, and tell `onCommit`. */
  function commit(next: number | undefined): void {
    value = next === undefined ? undefined : roundTo(clamp(next, min, max), precision);
    text = formatNumber(value, locales, formatOptions);
    onCommit?.(value);
  }

  function commitText(): void {
    if (text === formatted) return;
    const parsed = parseNumber(text, locales, formatOptions);
    if (parsed !== undefined && Number.isNaN(parsed)) {
      text = formatted;
      return;
    }
    commit(parsed);
  }

  /** Move by `delta`; from empty, land on `min` (or 0) rather than stepping. */
  function stepBy(delta: number): void {
    commit(value === undefined ? (min ?? 0) : value + delta);
  }

  const keySteps: Record<string, () => number | undefined> = {
    ArrowUp: () => step,
    ArrowDown: () => -step,
    PageUp: () => largeStep ?? step * 10,
    PageDown: () => -(largeStep ?? step * 10),
  };

  function handleKeydown(event: KeyboardEvent): void {
    const delta = keySteps[event.key]?.();
    if (delta !== undefined) {
      event.preventDefault();
      stepBy(delta);
    } else if (event.key === 'Home' && min !== undefined) {
      event.preventDefault();
      commit(min);
    } else if (event.key === 'End' && max !== undefined) {
      event.preventDefault();
      commit(max);
    } else if (event.key === 'Enter') {
      commitText();
    }
  }

  function stopRepeat(): void {
    clearTimeout(repeat);
    repeat = undefined;
  }

  /** Step now, then keep stepping while held, faster each time, until a bound. */
  function startRepeat(event: PointerEvent, delta: number): void {
    if (event.button !== 0 || disabled) return;
    event.preventDefault();
    input?.focus();
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // A synthetic or already-released pointer cannot be captured; the
      // pointerup / pointercancel listeners still stop the repeat.
    }
    stepBy(delta);
    const tick = (interval: number): void => {
      repeat = setTimeout(() => {
        if ((delta > 0 && atMax) || (delta < 0 && atMin)) return stopRepeat();
        stepBy(delta);
        tick(Math.max(REPEAT_MIN_MS, interval * 0.8));
      }, interval);
    };
    stopRepeat();
    repeat = setTimeout(() => tick(REPEAT_START_MS), REPEAT_DELAY_MS - REPEAT_START_MS);
  }

  /** A click that no pointer press preceded (`detail === 0`): assistive technology, step once. */
  function clickStep(event: MouseEvent, delta: number): void {
    if (event.detail === 0) stepBy(delta);
  }
</script>

{#snippet stepper(delta: number, label: string, bounded: boolean)}
  <button
    type="button"
    tabindex="-1"
    aria-controls={id}
    disabled={disabled || bounded}
    class={['btn btn-square btn-ghost', inputButtonSize[size]]}
    onpointerdown={(event) => startRepeat(event, delta)}
    onpointerup={stopRepeat}
    onpointercancel={stopRepeat}
    onlostpointercapture={stopRepeat}
    onclick={(event) => clickStep(event, delta)}
  >
    {#if delta < 0}
      <Minus class="size-4" aria-hidden="true" />
    {:else}
      <Plus class="size-4" aria-hidden="true" />
    {/if}
    <span class="sr-only">{label}</span>
  </button>
{/snippet}

<div class={['input w-full pe-1', inputSize[size], invalid && 'input-error', className]}>
  <input
    {...rest}
    bind:this={input}
    {id}
    type="text"
    role="spinbutton"
    autocomplete="off"
    inputmode={formatOptions?.maximumFractionDigits === 0 ? 'numeric' : 'decimal'}
    {disabled}
    aria-valuenow={value}
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuetext={value === undefined ? undefined : formatted}
    aria-describedby={describedBy === '' ? undefined : describedBy}
    aria-invalid={invalid ? 'true' : undefined}
    bind:value={text}
    onkeydown={(event) => {
      handleKeydown(event);
      onkeydown?.(event);
    }}
    onblur={(event) => {
      stopRepeat();
      commitText();
      onblur?.(event);
    }}
  />
  {#if showStepper}
    {@render stepper(-step, decrementLabel, atMin)}
    {@render stepper(step, incrementLabel, atMax)}
  {/if}
  {#if name !== undefined}
    <input type="hidden" {name} value={value === undefined ? '' : String(value)} {disabled} />
  {/if}
</div>
