<!-- @component
A daisyUI `input` over a native `<input>`, with a bindable `value` and `FieldControl` wiring.
-->
<!--
  TextInput — daisyUI `input` over a native `<input>`, with a bindable `value`
  and the `FieldControl` wiring (`describedBy` → `aria-describedby`, `invalid`
  → `aria-invalid` + `input-error`).

  ARIA contract: a native input, so the role, the keyboard and the validation
  semantics are the platform's. The component adds only the two attributes
  that tie it back to its `FormField`; everything else — `name`, `autocomplete`,
  `maxlength`, `pattern`, `data-*` — passes straight through, because a
  control that swallows those cannot be submitted, tested or hooked into.

  Decorations. With a `prefix`, `suffix`, `leading` or `trailing`, the input
  sits in daisyUI's composite `input` wrapper, and the wrapper takes the
  box classes and the caller's `class`. The wrapper is a `<div>`, not the
  `<label>` daisyUI's docs show: a label's text would join the field's
  accessible name, and a button in `trailing` would be mis-named and
  label-activated (`SearchInput`'s reasoning). Prefix and suffix are plain
  text — never `::before` content, which some screen readers skip — whose
  ids follow `describedBy` in the input's `aria-describedby`, so "Website,
  edit text, https://" is read; a pointer press on them focuses the input.
  They are never part of the value, so `FormData` holds only what was typed.
  A `leading` / `trailing` icon must be `aria-hidden`; an interactive one
  must be a named button (`IconButton`), a tab stop after the input.

  `showCount` with a `maxlength` adds the `CharacterCount` under the field:
  its visible "12 / 20" is in `aria-describedby`, and its polite live region
  speaks `remainingLabel` once per threshold crossed on the way to the limit.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue, HTMLInputAttributes } from 'svelte/elements';
  import CharacterCount from './CharacterCount.svelte';
  import { focusInputOnPress } from './affixes.ts';
  import { inputSize, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'size' | 'prefix'> {
    /**
     * The text. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /**
     * The text-ish `type`s. Dates have `DateInput`, files have `FileInput`.
     * @defaultValue `'text'`
     */
    type?: 'text' | 'email' | 'url' | 'password' | 'tel' | 'number' | 'search' | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** `FieldControl`: the field is in error — sets `aria-invalid` and the error style. */
    invalid?: boolean | undefined;
    /**
     * Ids for `aria-describedby`; empty means none.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the visible label's id. Not used — this control is
     * labelable, so the `FormField`'s `<label for>` already names it; taken
     * here so a spread `FieldControl` does not leak it as an attribute.
     */
    labelId?: string | undefined;
    /** Non-editable text before the value, e.g. "https://" or "$"; read as part of the description. */
    prefix?: string | undefined;
    /** Non-editable text after the value, e.g. "kg"; read as part of the description. */
    suffix?: string | undefined;
    /** Content at the start of the field: an `aria-hidden` icon, or a named button. */
    leading?: Snippet<[]> | undefined;
    /** Content at the end of the field: an `aria-hidden` icon, or a named button (a tab stop after the input). */
    trailing?: Snippet<[]> | undefined;
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
  }

  let {
    value = $bindable(''),
    type = 'text',
    size = 'md',
    invalid = false,
    describedBy = '',
    labelId: _labelId,
    prefix,
    suffix,
    leading,
    trailing,
    showCount = false,
    countLabel,
    countWarnAt,
    remainingLabel,
    maxlength,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const prefixId = `${uid}-prefix`;
  const suffixId = `${uid}-suffix`;
  const countId = `${uid}-count`;

  let input: HTMLInputElement | undefined = $state();

  const decorated = $derived(
    prefix !== undefined || suffix !== undefined || leading !== undefined || trailing !== undefined,
  );
  const max = $derived(typeof maxlength === 'number' ? maxlength : undefined);
  const counting = $derived(showCount && max !== undefined);
  const description = $derived(
    [
      describedBy,
      prefix !== undefined && prefixId,
      suffix !== undefined && suffixId,
      counting && countId,
    ]
      .filter((part) => typeof part === 'string' && part !== '')
      .join(' '),
  );
  const box = $derived(['input w-full', inputSize[size], invalid && 'input-error', className]);
  const focus = $derived(focusInputOnPress(() => input));
</script>

{#snippet field(classes: ClassValue)}
  <input
    {...rest}
    bind:this={input}
    {type}
    {maxlength}
    bind:value
    aria-invalid={invalid ? 'true' : undefined}
    aria-describedby={description === '' ? undefined : description}
    class={classes}
  />
{/snippet}

{#if decorated}
  <div class={box}>
    {@render leading?.()}
    {#if prefix !== undefined}
      <span id={prefixId} class="text-base-content/60 whitespace-nowrap select-none" {@attach focus}>
        {prefix}
      </span>
    {/if}
    {@render field('min-w-0 grow')}
    {#if suffix !== undefined}
      <span id={suffixId} class="text-base-content/60 whitespace-nowrap select-none" {@attach focus}>
        {suffix}
      </span>
    {/if}
    {@render trailing?.()}
  </div>
{:else}
  {@render field(box)}
{/if}
<CharacterCount
  id={countId}
  length={value.length}
  max={counting ? max : undefined}
  {countLabel}
  {remainingLabel}
  warnAt={countWarnAt}
/>
