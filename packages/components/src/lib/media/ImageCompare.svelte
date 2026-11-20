<!-- @component
Two images (or any two snippets) stacked under a divider that reveals one over the other, for before/after views. The divider is a bits-ui `Slider` thumb, so it is keyboard-operable and announces its position.
-->
<!--
  daisyUI's `diff` is not used: its divider is a CSS `resize` handle with no
  accessible value. The layers, the slider overlay and the clip are inline
  styles, not utilities: the clip follows a continuous value, and the layout
  must hold without the stylesheet (the browser tests load none).
  bits-ui 2.20 handles arrows, Home and End; Page Up / Page Down are added
  here, as `fields/Slider` does.
-->
<script lang="ts">
  import { Slider } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { pageStep } from '../fields/slider-keys.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'dir'> {
    /** The image on the leading side, revealed as the divider moves toward the trailing edge. */
    before: Snippet<[]>;
    /** The image on the trailing side. */
    after: Snippet<[]>;
    /**
     * Divider position, as a percentage of the width from the leading edge. Bindable.
     * @defaultValue `50`
     */
    value?: number | undefined;
    /**
     * Arrow-key step, in percent.
     * @defaultValue `1`
     */
    step?: number | undefined;
    /**
     * Reading direction; in `'rtl'` the leading image is on the right and the keys flip.
     * @defaultValue `'ltr'`
     */
    dir?: 'ltr' | 'rtl' | undefined;
    /**
     * Accessible name of the divider.
     * @defaultValue `'Comparison position'`
     */
    sliderLabel?: string | undefined;
    /** Visible caption over the leading image, e.g. "March". */
    beforeLabel?: string | undefined;
    /** Visible caption over the trailing image, e.g. "November". */
    afterLabel?: string | undefined;
    /**
     * The divider's spoken value.
     * @defaultValue `` (v) => `${v}% ${beforeLabel ?? 'before'}` ``
     */
    valueText?: ((value: number) => string) | undefined;
    /** Fired once per finished interaction (pointer-up, or a key press). */
    onCommit?: ((value: number) => void) | undefined;
  }

  let {
    before,
    after,
    value = $bindable(50),
    step = 1,
    dir = 'ltr',
    sliderLabel = 'Comparison position',
    beforeLabel,
    afterLabel,
    valueText = (v: number) => `${v}% ${beforeLabel ?? 'before'}`,
    onCommit,
    class: className,
    ...rest
  }: Props = $props();

  const scale = { min: 0, max: 100, step: 1 };
  const position = $derived(Math.min(100, Math.max(0, value)));

  /** Hides the trailing part of the leading layer: its right side in LTR, its left in RTL. */
  const clip = $derived(
    dir === 'rtl' ? `inset(0 0 0 ${100 - position}%)` : `inset(0 ${100 - position}% 0 0)`,
  );

  const layer = 'grid-area: 1 / 1; min-width: 0;';

  function commit(next: number): void {
    onCommit?.(next);
  }

  function onThumbKeydown(event: KeyboardEvent): void {
    if (event.key !== 'PageUp' && event.key !== 'PageDown') return;
    event.preventDefault();
    const next = Math.min(
      100,
      Math.max(0, pageStep(position, event.key === 'PageUp' ? 1 : -1, { ...scale, step })),
    );
    if (next === position) return;
    value = next;
    commit(next);
  }
</script>

<div
  role="group"
  {dir}
  {...rest}
  class={['overflow-hidden rounded-box', className]}
  style:display="grid"
  style:position="relative"
>
  <div style={layer}>{@render after()}</div>
  <div style={layer} style:clip-path={clip}>{@render before()}</div>
  {#if beforeLabel !== undefined}
    <span class="badge badge-neutral pointer-events-none absolute start-2 top-2">{beforeLabel}</span>
  {/if}
  {#if afterLabel !== undefined}
    <span class="badge badge-neutral pointer-events-none absolute end-2 top-2">{afterLabel}</span>
  {/if}
  <Slider.Root
    type="single"
    bind:value={
      () => position,
      (next: number) => {
        value = next;
      }
    }
    onValueCommit={commit}
    min={0}
    max={100}
    {step}
    {dir}
    orientation="horizontal"
    thumbPositioning="exact"
    class="cursor-ew-resize touch-none select-none"
    style="position: absolute; inset: 0;"
  >
    <Slider.Thumb
      index={0}
      aria-label={sliderLabel}
      aria-valuetext={valueText(position)}
      onkeydown={onThumbKeydown}
      class="group flex w-10 items-center justify-center outline-none"
      style="top: 0; bottom: 0; height: 100%;"
    >
      <span aria-hidden="true" class="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-base-100 shadow"></span>
      <span
        aria-hidden="true"
        class="btn btn-circle btn-sm pointer-events-none relative group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primary"
        >⇔</span
      >
    </Slider.Thumb>
  </Slider.Root>
</div>
