<!-- @component
The custom editor of `ColorPicker`: the saturation and brightness square, the hue and opacity strips, the hex field and the eyedropper. Internal: not exported.
-->
<!--
  The strips are bits-ui `Slider`s; the square is `ColorArea`. The strip
  gradients are inline: they paint the colour being edited, not theme.
-->
<script lang="ts" module>
  /** A checkerboard of base tokens, drawn under a translucent colour. */
  export const checkerboard =
    'repeating-conic-gradient(var(--color-base-300) 0 25%, var(--color-base-200) 0 50%) 0 0 / 0.75rem 0.75rem';
</script>

<script lang="ts">
  import { Pipette } from '@lucide/svelte';
  import { Slider } from 'bits-ui';
  import ColorArea from './ColorArea.svelte';
  import { formatColor, hsvToRgb, parseColor, rgbToHsv, type Hsva } from './color.ts';

  interface EyeDropperApi {
    open(): Promise<{ sRGBHex: string }>;
  }

  interface Props {
    /** The colour being edited. */
    hsva: Hsva;
    /** Called with every edit. */
    onChange: (next: Hsva) => void;
    /** Show the opacity strip and write alpha into the hex field. */
    alpha: boolean;
    /** Offer the eyedropper where the browser has it. */
    eyeDropper: boolean;
    areaLabel: string;
    saturationLabel: string;
    brightnessLabel: string;
    hueLabel: string;
    alphaLabel: string;
    hexLabel: string;
    eyeDropperLabel: string;
  }

  let {
    hsva,
    onChange,
    alpha,
    eyeDropper,
    areaLabel,
    saturationLabel,
    brightnessLabel,
    hueLabel,
    alphaLabel,
    hexLabel,
    eyeDropperLabel,
  }: Props = $props();

  const rgba = $derived(hsvToRgb(hsva));
  const hex = $derived(formatColor(rgba, 'hex', alpha));
  const opaqueCss = $derived(formatColor(rgba, 'rgb'));

  function commitHex(input: HTMLInputElement): void {
    const text = input.value.trim();
    const parsed = parseColor(text.startsWith('#') ? text : `#${text}`);
    if (parsed !== undefined) onChange(rgbToHsv(parsed, hsva.h));
    input.value = hex;
  }

  let canEyeDrop = $state(false);
  $effect(() => {
    canEyeDrop = 'EyeDropper' in window;
  });

  async function pickFromScreen(): Promise<void> {
    const EyeDropper = (window as unknown as { EyeDropper?: new () => EyeDropperApi }).EyeDropper;
    if (EyeDropper === undefined) return;
    try {
      const { sRGBHex } = await new EyeDropper().open();
      const parsed = parseColor(sRGBHex);
      if (parsed !== undefined) onChange({ ...rgbToHsv(parsed, hsva.h), alpha: hsva.alpha });
    } catch {
      // The reader pressed Escape: nothing was picked.
    }
  }
</script>

    <ColorArea
      hue={hsva.h}
      saturation={hsva.s}
      brightness={hsva.v}
      label={areaLabel}
      {saturationLabel}
      {brightnessLabel}
      onChange={(s, v) => onChange({ ...hsva, s, v })}
    />
    <Slider.Root
      type="single"
      bind:value={() => Math.round(hsva.h), (h: number) => onChange({ ...hsva, h })}
      min={0}
      max={360}
      step={1}
      thumbPositioning="exact"
      class="relative flex h-4 w-full touch-none items-center"
    >
      <span
        class="h-3 w-full rounded-full"
        style:background="linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))"
      ></span>
      <Slider.Thumb
        index={0}
        aria-label={hueLabel}
        aria-valuetext="{Math.round(hsva.h)}°"
        class="focus-visible:outline-primary size-4 rounded-full border-2 border-white shadow ring-1 ring-black/40 focus-visible:outline-2 focus-visible:outline-offset-2"
        style="background-color: hsl({hsva.h} 100% 50%);"
      />
    </Slider.Root>
    {#if alpha}
      <Slider.Root
        type="single"
        bind:value={
          () => Math.round(hsva.alpha * 100),
          (a: number) => onChange({ ...hsva, alpha: a / 100 })
        }
        min={0}
        max={100}
        step={1}
        thumbPositioning="exact"
        class="relative flex h-4 w-full touch-none items-center"
      >
        <span
          class="h-3 w-full rounded-full"
          style:background="linear-gradient(to right, transparent, {opaqueCss}), {checkerboard}"
        ></span>
        <Slider.Thumb
          index={0}
          aria-label={alphaLabel}
          aria-valuetext="{Math.round(hsva.alpha * 100)}%"
          class="focus-visible:outline-primary bg-base-100 size-4 rounded-full border-2 border-white shadow ring-1 ring-black/40 focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </Slider.Root>
    {/if}
    <div class="flex items-center gap-2">
      <input
        type="text"
        class="input input-sm grow font-mono"
        aria-label={hexLabel}
        spellcheck="false"
        autocomplete="off"
        value={hex}
        onblur={(event) => commitHex(event.currentTarget)}
        onkeydown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitHex(event.currentTarget);
          }
        }}
      />
      {#if eyeDropper && canEyeDrop}
        <button type="button" class="btn btn-sm btn-square" aria-label={eyeDropperLabel} onclick={pickFromScreen}>
          <Pipette class="size-4" aria-hidden="true" />
        </button>
      {/if}
    </div>
