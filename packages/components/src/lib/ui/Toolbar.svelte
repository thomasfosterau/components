<!-- @component
A `role="toolbar"` on bits-ui `Toolbar`: one Tab stop, arrow keys between its controls.
-->
<!--
  Toolbar — an editor's formatting row, a table's bulk-action bar, a canvas
  tool palette (APG Toolbar). Its controls are `ToolbarButton`,
  `ToolbarLink`, `ToolbarToggleGroup` and `ToolbarSeparator`, all bits-ui
  toolbar parts, so the whole row is ONE Tab stop with arrow keys within it.
  A plain `Button` or a nested `ToggleGroup` inside it would each add Tab
  stops of their own and break that.

  A toolbar is a composite widget. For a cluster of independent actions
  ("Save | Save as… | Discard") where each should be its own Tab stop, use
  `ButtonGroup`.

  ARIA and keyboard contract: bits-ui's `role="toolbar"` and roving
  tabindex; ← / → (↑ / ↓ when vertical), Home / End, wrapping with `loop`.
  We add the name (`label` → `aria-label`) and `aria-orientation`.

  `items` and `item` render the controls from data instead of `children`;
  with `overflow` too, those that don't fit move into a trailing "More"
  menu (`Overflow`), whose trigger is the last arrow-key stop. A hidden
  control leaves the arrow-key order, and the Tab stop never sits on one.
  An overflowing toolbar is horizontal.
-->
<script lang="ts" generics="T extends OverflowEntry">
  import { Toolbar } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { OverflowEntry, OverflowItemAttributes } from './Overflow.svelte';
  import ToolbarOverflow from './ToolbarOverflow.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Accessible name ("Formatting", "Bulk actions"). */
    label: string;
    /** @defaultValue `'horizontal'` */
    orientation?: 'horizontal' | 'vertical' | undefined;
    /**
     * Arrow keys wrap from the last control to the first.
     * @defaultValue `true`
     */
    loop?: boolean | undefined;
    /** The controls: `ToolbarButton`, `ToolbarLink`, `ToolbarToggleGroup`, `ToolbarSeparator`. Ignored when `items` and `item` are given. */
    children?: Snippet<[]> | undefined;
    /** The controls as data, rendered by `item`: what the "More" menu shows for each, with `overflow`. */
    items?: readonly T[] | undefined;
    /** Render one of `items` as a `ToolbarButton` or `ToolbarLink`, spreading the third argument onto it. */
    item?: Snippet<[T, number, OverflowItemAttributes]> | undefined;
    /**
     * Move the `items` that don't fit into a trailing "More" menu. Horizontal only.
     * @defaultValue `false`
     */
    overflow?: boolean | undefined;
    /**
     * Names the "More" menu button, with `overflow`.
     * @defaultValue `'More'`
     */
    moreLabel?: string | undefined;
  }

  let {
    label,
    orientation = 'horizontal',
    loop = true,
    children,
    items,
    item,
    overflow = false,
    moreLabel = 'More',
    class: className,
    ...rest
  }: Props = $props();

  const rowOrientation = $derived(overflow ? 'horizontal' : orientation);
  const rowClass = 'rounded-box bg-base-200 items-center gap-1 p-1';
</script>

<Toolbar.Root orientation={rowOrientation} {loop}>
  {#snippet child({ props })}
    {#if overflow && items !== undefined && item !== undefined}
      <ToolbarOverflow root={{ ...rest, ...props }} {label} {items} {item} {moreLabel} class={[rowClass, className]} />
    {:else}
      <div
        {...rest}
        {...props}
        aria-label={label}
        aria-orientation={rowOrientation}
        class={['inline-flex', rowClass, rowOrientation === 'vertical' && 'flex-col', className]}
      >
        {#if items !== undefined && item !== undefined}
          {#each items as entry, index (entry.id)}{@render item(entry, index, {})}{/each}
        {:else}
          {@render children?.()}
        {/if}
      </div>
    {/if}
  {/snippet}
</Toolbar.Root>
