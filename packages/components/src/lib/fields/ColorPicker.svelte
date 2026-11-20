<!-- @component
A colour, chosen from a popover of preset swatches and an optional custom editor (saturation and brightness square, hue and opacity strips, hex field, eyedropper). The value is a CSS colour string.
-->
<!--
  The popover is bits-ui's `Popover` (focus, Escape, outside click, focus
  return), the swatches are `ColorSwatchGroup`, and the hue and opacity
  strips are bits-ui `Slider`s. Only the saturation and brightness square is
  hand-rolled (`ColorArea`), because bits-ui has no two-dimensional slider.

  The editor works in HSV and keeps its own hue, so dragging through grey or
  black doesn't lose it. A picked swatch sets `value` to the swatch's own
  string; the editor writes `format`.

  Swatches, the trigger's well and the strips are painted with inline
  colours: that is the data being edited, not theme. The chrome uses
  semantic tokens.

  Naming: inside a `FormField` the label names the trigger through `for`;
  outside one, `triggerLabel` does. Either way the current colour's name
  (the matching swatch's `label`, else `describeColor`, else the hex) is in
  the trigger's description, so colour is never the only cue.
-->
<script lang="ts">
  import { Popover } from 'bits-ui';
  import type { HTMLAttributes } from 'svelte/elements';
  import ColorEditor, { checkerboard } from './ColorEditor.svelte';
  import ColorSwatchGroup, { type ColorSwatch } from './ColorSwatchGroup.svelte';
  import {
    formatColor,
    hsvToRgb,
    parseColor,
    rgbToHsv,
    type ColorFormat,
    type Hsva,
  } from './color.ts';
  import type { FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange'> {
    /**
     * The colour, as a CSS string. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /** Preset swatches. Omitted, the custom editor is shown alone. */
    swatches?: readonly ColorSwatch[] | undefined;
    /**
     * Offer the custom editor below the swatches.
     * @defaultValue `true`
     */
    allowCustom?: boolean | undefined;
    /**
     * Edit and write opacity.
     * @defaultValue `false`
     */
    alpha?: boolean | undefined;
    /**
     * How the custom editor writes `value`.
     * @defaultValue `'hex'`
     */
    format?: ColorFormat | undefined;
    /**
     * Offer a pick-from-screen button where the browser has the EyeDropper API (Chromium).
     * @defaultValue `true`
     */
    eyeDropper?: boolean | undefined;
    /** Posts the value under this name, through a hidden input. */
    name?: string | undefined;
    /**
     * Disables the trigger.
     * @defaultValue `false`
     */
    disabled?: boolean | undefined;
    /**
     * Daisy size step of the trigger.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /**
     * Names the trigger outside a `FormField`, and the popover always.
     * @defaultValue `'Choose colour'`
     */
    triggerLabel?: string | undefined;
    /**
     * Names the swatch group.
     * @defaultValue `'Swatches'`
     */
    swatchesLabel?: string | undefined;
    /**
     * Heading of the custom editor.
     * @defaultValue `'Custom colour'`
     */
    customLabel?: string | undefined;
    /**
     * Names the saturation and brightness square.
     * @defaultValue `'Saturation and brightness'`
     */
    areaLabel?: string | undefined;
    /**
     * Names the square's horizontal axis.
     * @defaultValue `'Saturation'`
     */
    saturationLabel?: string | undefined;
    /**
     * Names the square's vertical axis.
     * @defaultValue `'Brightness'`
     */
    brightnessLabel?: string | undefined;
    /**
     * Names the hue strip.
     * @defaultValue `'Hue'`
     */
    hueLabel?: string | undefined;
    /**
     * Names the opacity strip.
     * @defaultValue `'Opacity'`
     */
    alphaLabel?: string | undefined;
    /**
     * Names the hex field.
     * @defaultValue `'Hex'`
     */
    hexLabel?: string | undefined;
    /**
     * Names the eyedropper button.
     * @defaultValue `'Pick from screen'`
     */
    eyeDropperLabel?: string | undefined;
    /**
     * Read when no colour is set.
     * @defaultValue `'No colour'`
     */
    emptyLabel?: string | undefined;
    /** Names a colour that matches no swatch, for the trigger's description. Falls back to its hex. */
    describeColor?: ((value: string) => string) | undefined;
    /** Fired on every change, including each frame of a drag. */
    onValueChange?: ((value: string) => void) | undefined;
    /** Fired when the popover closes with a value different from when it opened. */
    onCommit?: ((value: string) => void) | undefined;
    /** `FieldControl`: the trigger's `id`, which a `FormField` label points at. */
    id?: string | undefined;
    /** `FieldControl`: the visible label's id. When set, the label names the trigger instead of `triggerLabel`. */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids added to the trigger's `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the field is in error — sets `aria-invalid` and an error outline.
     * @defaultValue `false`
     */
    invalid?: boolean | undefined;
    /**
     * `FieldControl`: sets `aria-required` on the trigger.
     * @defaultValue `false`
     */
    required?: boolean | undefined;
  }

  let {
    value = $bindable(''),
    swatches,
    allowCustom = true,
    alpha = false,
    format = 'hex',
    eyeDropper = true,
    name,
    disabled = false,
    size = 'md',
    triggerLabel = 'Choose colour',
    swatchesLabel = 'Swatches',
    customLabel = 'Custom colour',
    areaLabel = 'Saturation and brightness',
    saturationLabel = 'Saturation',
    brightnessLabel = 'Brightness',
    hueLabel = 'Hue',
    alphaLabel = 'Opacity',
    hexLabel = 'Hex',
    eyeDropperLabel = 'Pick from screen',
    emptyLabel = 'No colour',
    describeColor,
    onValueChange,
    onCommit,
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
  const descriptionId = `${uid}-colour`;
  const customHeadingId = `${uid}-custom`;

  const triggerSize: Record<FieldSize, string> = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  function hsvaOf(css: string, hue: number): Hsva {
    const parsed = parseColor(css);
    return parsed === undefined ? { h: hue, s: 0, v: 0, alpha: 1 } : rgbToHsv(parsed, hue);
  }

  // The editor's own state; re-read from `value` only when someone else changes it.
  let hsva: Hsva = $state(hsvaOf(value, 0));
  let written = value;
  $effect.pre(() => {
    if (value !== written) {
      written = value;
      hsva = hsvaOf(value, hsva.h);
    }
  });

  function write(next: string): void {
    written = next;
    value = next;
    onValueChange?.(next);
  }

  function setHsva(next: Hsva): void {
    hsva = alpha ? next : { ...next, alpha: 1 };
    write(formatColor(hsvToRgb(hsva), format, alpha));
  }

  const rgba = $derived(hsvToRgb(hsva));
  const hex = $derived(formatColor(rgba, 'hex', alpha));
  const matched = $derived(
    swatches?.find((swatch) => swatch.value.toLowerCase() === value.trim().toLowerCase()),
  );
  const description = $derived(
    value === ''
      ? emptyLabel
      : (matched?.label ?? describeColor?.(value) ?? (parseColor(value) === undefined ? value : hex)),
  );
  const fill = $derived(value === '' ? 'transparent' : value);
  const triggerText = $derived(value === '' ? emptyLabel : (matched?.label ?? hex));
  const showCustom = $derived(swatches === undefined || allowCustom);

  let open = $state(false);
  let openedWith = '';
  function onOpenChange(next: boolean): void {
    if (next) openedWith = value;
    else if (value !== openedWith) onCommit?.(value);
  }
</script>

<div {...rest} class={['inline-flex', className]}>
  <Popover.Root bind:open {onOpenChange}>
    <Popover.Trigger
      {id}
      {disabled}
      aria-label={labelId === undefined ? triggerLabel : undefined}
      aria-describedby={[descriptionId, describedBy].filter((part) => part !== '').join(' ')}
      aria-invalid={invalid ? 'true' : undefined}
      aria-required={required ? 'true' : undefined}
      class={['btn gap-2 font-mono', triggerSize[size], invalid && 'btn-error btn-outline']}
    >
      <span
        aria-hidden="true"
        class="rounded-field border-base-300 inline-block size-5 border"
        style:background="linear-gradient({fill}, {fill}), {checkerboard}"
      ></span>
      <span aria-hidden="true">{triggerText}</span>
    </Popover.Trigger>
    <span id={descriptionId} hidden>{description}</span>
    <Popover.Portal>
      <Popover.Content
        role="dialog"
        aria-label={triggerLabel}
        sideOffset={8}
        align="start"
        class="card card-border bg-base-100 rounded-box z-50 flex w-64 flex-col gap-3 p-3 shadow-md"
      >
        {#if swatches !== undefined}
          <ColorSwatchGroup
            {swatches}
            label={swatchesLabel}
            size="sm"
            bind:value={
              () => matched?.value ?? '',
              (next: string) => {
                const parsed = parseColor(next);
                if (parsed !== undefined) hsva = rgbToHsv(parsed, hsva.h);
                write(next);
              }
            }
          />
        {/if}
        {#if showCustom}
          <div role="group" aria-labelledby={customHeadingId} class="flex flex-col gap-3">
            {#if swatches !== undefined}
              <p id={customHeadingId} class="text-sm font-semibold">{customLabel}</p>
            {:else}
              <span id={customHeadingId} class="sr-only">{customLabel}</span>
            {/if}
            <ColorEditor
              {hsva}
              onChange={setHsva}
              {alpha}
              {eyeDropper}
              {areaLabel}
              {saturationLabel}
              {brightnessLabel}
              {hueLabel}
              {alphaLabel}
              {hexLabel}
              {eyeDropperLabel}
            />
          </div>
        {/if}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
  {#if name !== undefined}
    <input type="hidden" {name} {value} {disabled} />
  {/if}
</div>
