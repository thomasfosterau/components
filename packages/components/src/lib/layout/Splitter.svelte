<!-- @component
Two panes side by side (or stacked) with a draggable, keyboard-operable divider between them; `size` is the leading pane's share in percent, bindable, and `onCommit` reports each settled size.
-->
<!--
  Splitter — the APG window splitter
  (https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/): a plan canvas
  beside its properties panel, a list beside the record it opens. Nest a
  Splitter inside a pane for three-way layouts.

  The handle is `SplitterHandle`, shared with `ListDetailLayout`'s
  `resizable` divider. Hand-rolled, deliberately: bits-ui has no splitter primitive, and paneforge
  (its authors' resizable panes) is a third-party runtime dependency, which
  under AGENTS.md would force a separate package for a contract this small:
  one focusable separator, five keys and a captured pointer.

  ARIA contract: the handle is `role="separator"`, focusable, named by
  `handleLabel`, with `aria-valuenow` (the leading size, rounded),
  `aria-valuemin` (`minSize`, or `0` when `collapsible`), `aria-valuemax` and
  `aria-controls` pointing at the leading pane. Its `aria-orientation` is the
  opposite of the layout's: panes side by side are split by a vertical line.
  The panes are plain `<div>`s; their landmarks and headings are the caller's.

  Keys: ←/→ (side by side) or ↑/↓ (stacked) shrink and grow the leading pane
  by `step`; under `dir="rtl"`, ← grows the leading (right-hand) pane. Home and
  End jump to `minSize` and `maxSize`. Enter, when `collapsible`, collapses the
  leading pane to 0 and restores it. Dragging the handle captures the pointer
  and moves `size` live; `onCommit` fires once per key press or drag that
  changed it, so persisting the layout never happens per frame.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import SplitterHandle from './SplitterHandle.svelte';

  type Orientation = 'horizontal' | 'vertical';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The leading pane: left (right under RTL) when side by side, top when stacked. */
    start: Snippet<[]>;
    /** The trailing pane. */
    end: Snippet<[]>;
    /**
     * The leading pane's size, in percent of the container. Bindable.
     * @defaultValue `50`
     */
    size?: number | undefined;
    /**
     * The smallest leading size, in percent.
     * @defaultValue `10`
     */
    minSize?: number | undefined;
    /**
     * The largest leading size, in percent.
     * @defaultValue `90`
     */
    maxSize?: number | undefined;
    /**
     * How far one arrow key moves the divider, in percent.
     * @defaultValue `5`
     */
    step?: number | undefined;
    /**
     * Whether Enter collapses the leading pane to 0 and restores it.
     * @defaultValue `false`
     */
    collapsible?: boolean | undefined;
    /**
     * `'horizontal'` puts the panes side by side; `'vertical'` stacks them.
     * @defaultValue `'horizontal'`
     */
    orientation?: Orientation | undefined;
    /**
     * The handle's accessible name ("Resize properties panel").
     * @defaultValue `'Resize panes'`
     */
    handleLabel?: string | undefined;
    /** Called with the settled size after each key press or drag that changed it: the hook to persist a layout. */
    onCommit?: ((size: number) => void) | undefined;
  }

  let {
    start,
    end,
    size = $bindable(50),
    minSize = 10,
    maxSize = 90,
    step = 5,
    collapsible = false,
    orientation = 'horizontal',
    handleLabel = 'Resize panes',
    onCommit,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const startId = `${uid}-start`;

  // The flex layout is inline, not Tailwind: it is the component's structure,
  // and a splitter whose panes are not side by side is broken whatever the
  // theme. Classes carry only the look (tokens, cursor, hit area).
  const flexDirection: Record<Orientation, string> = {
    horizontal: 'row',
    vertical: 'column',
  };

  let container = $state<HTMLDivElement | undefined>(undefined);

  // The handle clamps and commits; this is the same reading of `size`, for the pane.
  const current = $derived(collapsible && size === 0 ? 0 : Math.min(maxSize, Math.max(minSize, size)));
</script>

<div
  {...rest}
  bind:this={container}
  class={['min-h-0 min-w-0', className]}
  style:display="flex"
  style:flex-direction={flexDirection[orientation]}
>
  <div id={startId} class="min-h-0 min-w-0 overflow-auto" style:flex="0 0 {current}%">
    {@render start()}
  </div>
  <SplitterHandle
    bind:value={size}
    min={minSize}
    max={maxSize}
    {step}
    {collapsible}
    {orientation}
    label={handleLabel}
    controls={startId}
    container={() => container}
    {onCommit}
    style="flex: 0 0 0.25rem"
  />
  <div class="min-h-0 min-w-0 overflow-auto" style:flex="1 1 0%">
    {@render end()}
  </div>
</div>
