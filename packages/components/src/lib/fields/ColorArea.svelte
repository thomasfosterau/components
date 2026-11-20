<!-- @component
The saturation and brightness square of `ColorPicker`'s custom editor. Internal: not exported.
-->
<!--
  Hand-rolled: bits-ui 2.20 has no two-dimensional slider. A 2-D control has
  no ARIA role of its own, so this follows React Aria's `ColorArea`: one
  visible thumb holding two visually hidden range inputs, saturation (in the
  tab order) and brightness (reachable by assistive tech). Arrow keys on
  either move both axes: left/right saturation, up/down brightness, Shift
  ten at a time, Page Up/Down brightness by ten, Home/End saturation to its
  ends. The layout is inline style so it holds without the stylesheet.
-->
<script lang="ts">
  interface Props {
    /** Hue in degrees, for the square's colour. */
    hue: number;
    /** Saturation, 0–1. */
    saturation: number;
    /** Brightness (HSV value), 0–1. */
    brightness: number;
    /** Called with the new saturation and brightness, each 0–1. */
    onChange: (saturation: number, brightness: number) => void;
    /** Names the square as a group. */
    label: string;
    /** Names the saturation input. */
    saturationLabel: string;
    /** Names the brightness input. */
    brightnessLabel: string;
    disabled?: boolean | undefined;
  }

  let {
    hue,
    saturation,
    brightness,
    onChange,
    label,
    saturationLabel,
    brightnessLabel,
    disabled = false,
  }: Props = $props();

  let area: HTMLDivElement | undefined = $state();
  let saturationInput: HTMLInputElement | undefined = $state();

  const s = $derived(Math.round(saturation * 100));
  const v = $derived(Math.round(brightness * 100));
  const clampPercent = (n: number): number => Math.min(100, Math.max(0, n));

  function set(nextS: number, nextV: number): void {
    onChange(clampPercent(nextS) / 100, clampPercent(nextV) / 100);
  }

  const keyMoves: Record<string, (by: number) => readonly [number, number]> = {
    ArrowRight: (by) => [s + by, v],
    ArrowLeft: (by) => [s - by, v],
    ArrowUp: (by) => [s, v + by],
    ArrowDown: (by) => [s, v - by],
    PageUp: () => [s, v + 10],
    PageDown: () => [s, v - 10],
    Home: () => [0, v],
    End: () => [100, v],
  };

  function onkeydown(event: KeyboardEvent): void {
    const move = keyMoves[event.key];
    if (move === undefined || disabled) return;
    event.preventDefault();
    const [nextS, nextV] = move(event.shiftKey ? 10 : 1);
    set(nextS, nextV);
  }

  function fromPointer(event: PointerEvent): void {
    if (area === undefined) return;
    const rect = area.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    set(
      ((event.clientX - rect.left) / rect.width) * 100,
      (1 - (event.clientY - rect.top) / rect.height) * 100,
    );
  }

  function onpointerdown(event: PointerEvent): void {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    area?.setPointerCapture(event.pointerId);
    saturationInput?.focus();
    fromPointer(event);
  }

  function onpointermove(event: PointerEvent): void {
    if (area?.hasPointerCapture(event.pointerId) === true) fromPointer(event);
  }
</script>

<div
  bind:this={area}
  role="group"
  aria-label={label}
  class="rounded-field cursor-crosshair touch-none"
  style:position="relative"
  style:height="9rem"
  style:background="linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl({hue} 100% 50%))"
  {onpointerdown}
  {onpointermove}
>
  <div
    class="rounded-full border-2 border-white shadow ring-1 ring-black/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
    style:position="absolute"
    style:width="1rem"
    style:height="1rem"
    style:left="{s}%"
    style:top="{100 - v}%"
    style:translate="-50% -50%"
  >
    <input
      bind:this={saturationInput}
      type="range"
      class="sr-only"
      min="0"
      max="100"
      step="1"
      value={s}
      {disabled}
      aria-label={saturationLabel}
      aria-valuetext="{saturationLabel} {s}%"
      {onkeydown}
      oninput={(event) => set(Number(event.currentTarget.value), v)}
    />
    <input
      type="range"
      tabindex="-1"
      class="sr-only"
      min="0"
      max="100"
      step="1"
      value={v}
      {disabled}
      aria-label={brightnessLabel}
      aria-valuetext="{brightnessLabel} {v}%"
      {onkeydown}
      oninput={(event) => set(s, Number(event.currentTarget.value))}
    />
  </div>
</div>
