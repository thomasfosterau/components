<!-- @component
One colour from a palette of named swatches, on bits-ui's `RadioGroup`: a tag's colour, a bed's map colour.
-->
<!--
  bits-ui supplies the radiogroup roles, the single tab stop, arrow-key
  selection with wrap-around, and the hidden input under `name`. Each swatch
  is named by its `label`, never its hex, so colour is never the only cue.

  The swatches are filled with the caller's colours through inline
  `background-color`: that is data, not theme. A value is used only when it
  is a colour (`safeCssColor`), so it can't add other declarations; anything
  else leaves the swatch unfilled. bits-ui takes `style` as an object, as
  `style:` directives don't reach a component. The chrome (rings, focus
  outline) uses semantic tokens. The selected swatch's check is drawn in
  black or white, whichever contrasts more with that swatch (`color.ts`),
  and the swatch also gets a ring so the state survives a swatch close to
  the background.

  Named by `aria-labelledby={labelId}` inside a `FormField`; outside one,
  pass `label`, which becomes the group's `aria-label`.
-->
<script lang="ts" module>
  /** One preset colour. */
  export interface ColorSwatch {
    /** A CSS colour: hex, `rgb()`, `hsl()`, `oklch()` or any other value `background-color` takes; anything else leaves the swatch unfilled. */
    readonly value: string;
    /** Accessible name, e.g. "Leaf green". */
    readonly label: string;
  }
</script>

<script lang="ts">
  import { Check } from '@lucide/svelte';
  import { RadioGroup } from 'bits-ui';
  import type { HTMLAttributes } from 'svelte/elements';
  import { contrastingInk, safeCssColor } from './color.ts';
  import type { FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'dir'> {
    /** The preset colours, in order. */
    swatches: readonly ColorSwatch[];
    /**
     * The chosen swatch's `value`; empty string when nothing is chosen. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /** Fired when the reader picks a swatch. */
    onValueChange?: ((value: string) => void) | undefined;
    /** Posts the value under this name (bits-ui's hidden input). */
    name?: string | undefined;
    /**
     * Disables every swatch.
     * @defaultValue `false`
     */
    disabled?: boolean | undefined;
    /**
     * Swatch size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** Accessible name, for a group outside a `FormField`; ignored when `labelId` is set. */
    label?: string | undefined;
    /** `FieldControl`: the group's `id`. */
    id?: string | undefined;
    /** `FieldControl`: the visible label's id; the group is `aria-labelledby` it. */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the field is in error — sets `aria-invalid`.
     * @defaultValue `false`
     */
    invalid?: boolean | undefined;
    /**
     * `FieldControl`: a swatch must be chosen.
     * @defaultValue `false`
     */
    required?: boolean | undefined;
  }

  let {
    swatches,
    value = $bindable(''),
    onValueChange,
    name,
    disabled = false,
    size = 'md',
    label,
    id,
    labelId,
    describedBy = '',
    invalid = false,
    required = false,
    class: className,
    ...rest
  }: Props = $props();

  const swatchSize: Record<FieldSize, string> = {
    xs: 'size-5',
    sm: 'size-6',
    md: 'size-8',
    lg: 'size-10',
  };

  const checkSize: Record<FieldSize, string> = {
    xs: 'size-3',
    sm: 'size-3.5',
    md: 'size-4',
    lg: 'size-5',
  };
</script>

<RadioGroup.Root
  {...rest}
  bind:value
  onValueChange={(next: string) => onValueChange?.(next)}
  {...name === undefined ? {} : { name }}
  {...id === undefined ? {} : { id }}
  {required}
  {disabled}
  orientation="horizontal"
  aria-orientation="horizontal"
  aria-labelledby={labelId}
  aria-label={labelId === undefined ? label : undefined}
  aria-describedby={describedBy === '' ? undefined : describedBy}
  aria-invalid={invalid ? 'true' : undefined}
  class={['flex flex-wrap gap-2', className]}
>
  {#each swatches as swatch (swatch.value)}
    {@const fill = safeCssColor(swatch.value)}
    <RadioGroup.Item
      value={swatch.value}
      aria-label={swatch.label}
      title={swatch.label}
      style={fill === undefined
        ? undefined
        : { backgroundColor: fill, color: contrastingInk(fill) ?? 'inherit' }}
      class={[
        'rounded-field grid cursor-pointer place-items-center border border-base-content/20',
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary',
        'data-[state=checked]:ring-2 data-[state=checked]:ring-base-content data-[state=checked]:ring-offset-2 data-[state=checked]:ring-offset-base-100',
        'disabled:cursor-not-allowed disabled:opacity-50',
        swatchSize[size],
      ]}
    >
      {#snippet children({ checked })}
        {#if checked}
          <Check class={checkSize[size]} strokeWidth={3} aria-hidden="true" />
        {/if}
      {/snippet}
    </RadioGroup.Item>
  {/each}
</RadioGroup.Root>
