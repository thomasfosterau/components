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
-->
<script lang="ts">
  import { Toolbar } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

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
    /** The controls: `ToolbarButton`, `ToolbarLink`, `ToolbarToggleGroup`, `ToolbarSeparator`. */
    children: Snippet<[]>;
  }

  let { label, orientation = 'horizontal', loop = true, children, class: className, ...rest }: Props = $props();
</script>

<Toolbar.Root {orientation} {loop}>
  {#snippet child({ props })}
    <div
      {...rest}
      {...props}
      aria-label={label}
      aria-orientation={orientation}
      class={[
        'rounded-box bg-base-200 inline-flex items-center gap-1 p-1',
        orientation === 'vertical' && 'flex-col',
        className,
      ]}
    >
      {@render children()}
    </div>
  {/snippet}
</Toolbar.Root>
