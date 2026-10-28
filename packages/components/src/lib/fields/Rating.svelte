<!-- @component
A score out of N as stars: an input on bits-ui's `RatingGroup` that binds a number (optionally in half steps) and posts under `name`, or, with `readonly`, a static display named "4.5 out of 5".
-->
<!--
  Rating — one component, two branches.

  Input (the default): bits-ui's `RatingGroup`. Its root is `role="slider"`
  (bits-ui 2.20, `rating-group.svelte.js`) — one Tab stop, with the stars
  `role="presentation"` — so there is no "radio button 4 of 5" with no
  context. There is no APG rating pattern; bits-ui follows the slider one.
  bits-ui supplies the role, `aria-valuenow` / `min` / `max`,
  `aria-valuetext` (from `formatValue` here), `aria-readonly`,
  `aria-disabled`, `aria-required`, the hidden input under `name`, the
  arrow / Home / End / Page keys, digit keys (with `allowHalf`, "3" then
  ".5" gives 3.5), and half-step pointer handling. This file adds the
  accessible name, `aria-describedby` and `aria-invalid`.

  Naming: a `<label for>` cannot name a `div`, so inside a `FormField` the
  root takes `aria-labelledby={labelId}` (`FieldControl.labelId`, #179) and
  `FormField` forwards a label click to it. Outside one, `label` becomes the
  root's `aria-label`.

  Clearing: bits-ui clears the value to 0 when the first star is clicked
  while the value already equals it (pointer only; no key clears below
  `min`, which is 0). That is left as bits-ui ships it, not hand-patched.

  Read-only display (`readonly`): plain markup with no bits-ui root mounted —
  `role="img"` with `aria-label={formatValue(value, max)}`, every star
  `aria-hidden`, nothing focusable, nothing posted. It rounds to the nearest
  half star whatever `allowHalf` says, because a display usually shows an
  average ("4.5 out of 5"). The label still says the exact value.

  Styling: daisyUI's `rating-*` size classes set `--size`; each star is two
  `mask mask-star-2` halves (`mask-half-1` / `mask-half-2`, which flip in
  RTL), filled in the tone's background or left at `bg-base-content/20`.
  daisyUI's `rating` class itself is not used: its `.rating *` rules style
  every descendant, which fights bits-ui's item wrappers.
-->
<script lang="ts">
  import { RatingGroup } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { backgroundTone, type Size, type Tone } from '../ui/tones.ts';
  import { ratingSize } from './field-types.ts';

  /** How much of one star is filled. */
  type StarState = 'active' | 'partial' | 'inactive';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'dir'> {
    /**
     * The score. Bindable.
     * @defaultValue `0`
     */
    value?: number | undefined;
    /**
     * Number of stars.
     * @defaultValue `5`
     */
    max?: number | undefined;
    /**
     * Allow half-star values (bits-ui `allowHalf`).
     * @defaultValue `false`
     */
    allowHalf?: boolean | undefined;
    /**
     * Render a static, unfocusable display instead of an input.
     * @defaultValue `false`
     */
    readonly?: boolean | undefined;
    /**
     * Preview the hovered value before it is chosen (bits-ui `hoverPreview`).
     * @defaultValue `true`
     */
    hoverPreview?: boolean | undefined;
    /**
     * The spoken value (the input's `aria-valuetext`); also the display's accessible name.
     * @defaultValue `(value, max) => \`${value} out of ${max}\``
     */
    formatValue?: ((value: number, max: number) => string) | undefined;
    /** Posts the value under this name (input only). */
    name?: string | undefined;
    /**
     * Blocks keys and clicks, and posts nothing.
     * @defaultValue `false`
     */
    disabled?: boolean | undefined;
    /**
     * Colour of the filled stars.
     * @defaultValue `'warning'`
     */
    tone?: Tone | undefined;
    /**
     * daisyUI `rating` size step.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /** Replace the star glyph (a heart, a leaf); receives how much of it is filled. It is rendered inside an `aria-hidden` wrapper. */
    item?: Snippet<[{ state: StarState }]> | undefined;
    /**
     * Accessible name, for a rating outside a `FormField`; ignored when `labelId` is set.
     * @defaultValue `'Rating'`
     */
    label?: string | undefined;
    /** `FieldControl`: the root's `id`. Minted when omitted. */
    id?: string | undefined;
    /** `FieldControl`: the visible label's id; the root is `aria-labelledby` it. */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the field is in error — sets `aria-invalid` and an error outline.
     * @defaultValue `false`
     */
    invalid?: boolean | undefined;
    /**
     * `FieldControl`: sets `aria-required` and the hidden input's `required`.
     * @defaultValue `false`
     */
    required?: boolean | undefined;
  }

  let {
    value = $bindable(0),
    max = 5,
    allowHalf = false,
    readonly = false,
    hoverPreview = true,
    formatValue = (score: number, outOf: number) => `${score} out of ${outOf}`,
    name,
    disabled = false,
    tone = 'warning',
    size = 'md',
    item,
    label = 'Rating',
    id: idProp,
    labelId,
    describedBy = '',
    invalid = false,
    required = false,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const id = $derived(idProp ?? uid);
  const fill = $derived(backgroundTone[tone]);
  // bits-ui types `name` as a bare optional, so it is omitted rather than passed as `undefined`.
  const nameProp = $derived(name === undefined ? {} : { name });

  /** The display's stars: the value rounded to the nearest half. */
  const displayStates = $derived.by((): readonly StarState[] => {
    const shown = Math.round(value * 2) / 2;
    return Array.from({ length: max }, (_, index): StarState => {
      if (shown >= index + 1) return 'active';
      return shown >= index + 0.5 ? 'partial' : 'inactive';
    });
  });
</script>

{#snippet star(state: StarState)}
  <span aria-hidden="true" class="flex">
    {#if item}
      {@render item({ state })}
    {:else}
      <span
        class={[
          'mask mask-star-2 mask-half-1 h-[calc(var(--size))] w-[calc(var(--size)*0.5)]',
          state === 'inactive' ? 'bg-base-content/20' : fill,
        ]}
      ></span>
      <span
        class={[
          'mask mask-star-2 mask-half-2 h-[calc(var(--size))] w-[calc(var(--size)*0.5)]',
          state === 'active' ? fill : 'bg-base-content/20',
        ]}
      ></span>
    {/if}
  </span>
{/snippet}

{#if readonly}
  <div
    {...rest}
    {id}
    role="img"
    aria-label={formatValue(value, max)}
    class={['inline-flex align-middle', ratingSize[size], className]}
  >
    {#each displayStates as state, index (index)}
      {@render star(state)}
    {/each}
  </div>
{:else}
  <RatingGroup.Root
    {...rest}
    bind:value
    {id}
    {max}
    {allowHalf}
    {hoverPreview}
    {...nameProp}
    {disabled}
    {required}
    aria-valuetext={formatValue}
    aria-label={labelId === undefined ? label : undefined}
    aria-labelledby={labelId}
    aria-describedby={describedBy === '' ? undefined : describedBy}
    aria-invalid={invalid ? 'true' : undefined}
    class={[
      'inline-flex rounded-field align-middle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-[disabled]:opacity-50',
      invalid && 'outline-2 outline-offset-2 outline-error',
      ratingSize[size],
      className,
    ]}
  >
    {#snippet children({ items })}
      {#each items as entry (entry.index)}
        <RatingGroup.Item
          index={entry.index}
          class="cursor-pointer data-[disabled]:cursor-not-allowed"
        >
          {#snippet children({ state })}
            {@render star(state)}
          {/snippet}
        </RatingGroup.Item>
      {/each}
    {/snippet}
  </RatingGroup.Root>
{/if}
