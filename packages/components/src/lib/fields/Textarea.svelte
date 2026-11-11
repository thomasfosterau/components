<!-- @component
A daisyUI `textarea` with a bindable `value` and `FieldControl` wiring. `rows` defaults to `4`.
-->
<!--
  Textarea — daisyUI `textarea` with a bindable `value` and the same
  `FieldControl` wiring as `TextInput`.

  ARIA contract: a native `<textarea>`; the component adds `aria-describedby`
  and `aria-invalid` and nothing else. `showCount` adds `TextInput`'s
  character counter (in `aria-describedby`, announced politely near the
  limit).

  `autoGrow`: the field grows with its content from `minRows` to `maxRows`
  lines, then scrolls (`resize-none` while growing, `resize-y` once at the
  cap). It is CSS `field-sizing: content` where the browser has it, with
  `min-height` / `max-height` measured from the line height; elsewhere an
  `$effect` sets the height from `scrollHeight` on every change. The server
  renders `rows={minRows}`, so hydration does not jump, and the element is
  never replaced, so the caret and undo history survive.
-->
<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import CharacterCount from './CharacterCount.svelte';
  import { rowsHeight } from './autogrow.ts';
  import { textareaSize, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLTextareaAttributes, 'value'> {
    /**
     * The text. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** `FieldControl`: the field is in error — sets `aria-invalid` and the error style. */
    invalid?: boolean | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the visible label's id. Not used — this control is
     * labelable, so the `FormField`'s `<label for>` already names it; taken
     * here so a spread `FieldControl` does not leak it as an attribute.
     */
    labelId?: string | undefined;
    /**
     * Show "n / maxlength" under the field. Needs `maxlength`.
     * @defaultValue `false`
     */
    showCount?: boolean | undefined;
    /**
     * The visible count.
     * @defaultValue `(n, max) => \`${n} / ${max}\``
     */
    countLabel?: ((length: number, max: number) => string) | undefined;
    /**
     * Characters left at which the count starts being announced (then at half of it, and at 0).
     * @defaultValue `max(10, maxlength × 0.1)`, rounded
     */
    countWarnAt?: number | undefined;
    /**
     * The announcement as the limit nears.
     * @defaultValue `(left) => \`${left} characters left\``
     */
    remainingLabel?: ((left: number) => string) | undefined;
    /**
     * Grow with the content between `minRows` and `maxRows`, then scroll.
     * @defaultValue `false`
     */
    autoGrow?: boolean | undefined;
    /**
     * Fewest lines shown while growing.
     * @defaultValue `rows`
     */
    minRows?: number | undefined;
    /**
     * Most lines shown while growing; beyond this the field scrolls.
     * @defaultValue `12`
     */
    maxRows?: number | undefined;
  }

  let {
    value = $bindable(''),
    size = 'md',
    invalid = false,
    describedBy = '',
    labelId: _labelId,
    rows = 4,
    showCount = false,
    countLabel,
    countWarnAt,
    remainingLabel,
    autoGrow = false,
    minRows,
    maxRows = 12,
    maxlength,
    style,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const countId = `${uid}-count`;

  let textarea: HTMLTextAreaElement | undefined = $state();
  /** The measured bounds; `undefined` until mounted (and on the server). */
  let bounds: { readonly min: number; readonly max: number } | undefined = $state();
  let atCap = $state(false);

  const fewest = $derived(Math.max(minRows ?? rows ?? 4, 1));
  const most = $derived(Math.max(maxRows, fewest));
  const max = $derived(typeof maxlength === 'number' ? maxlength : undefined);
  const counting = $derived(showCount && max !== undefined);
  const description = $derived(
    [describedBy, counting && countId].filter((part) => typeof part === 'string' && part !== '').join(' '),
  );
  const native = typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content');

  $effect(() => {
    if (!autoGrow || textarea === undefined) {
      bounds = undefined;
      return;
    }
    const computed = getComputedStyle(textarea);
    bounds = { min: rowsHeight(computed, fewest), max: rowsHeight(computed, most) };
  });

  // Track the content: set the height where `field-sizing` is missing, and
  // note when it has reached the cap (which turns manual resizing back on).
  $effect(() => {
    void value;
    if (bounds === undefined || textarea === undefined) {
      atCap = false;
      return;
    }
    if (!native) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, bounds.min), bounds.max)}px`;
    }
    atCap = textarea.scrollHeight > textarea.clientHeight;
  });

  const growStyle = $derived(
    bounds === undefined
      ? undefined
      : `${native ? 'field-sizing: content; ' : ''}min-height: ${bounds.min}px; max-height: ${bounds.max}px;`,
  );
</script>

<textarea
  {...rest}
  bind:this={textarea}
  rows={autoGrow ? fewest : rows}
  {maxlength}
  bind:value
  style={[growStyle, style].filter(Boolean).join(' ') || undefined}
  aria-invalid={invalid ? 'true' : undefined}
  aria-describedby={description === '' ? undefined : description}
  class={[
    'textarea w-full',
    textareaSize[size],
    invalid && 'textarea-error',
    autoGrow && (atCap ? 'resize-y' : 'resize-none'),
    className,
  ]}
></textarea>
<CharacterCount
  id={countId}
  length={value.length}
  max={counting ? max : undefined}
  {countLabel}
  {remainingLabel}
  warnAt={countWarnAt}
/>
