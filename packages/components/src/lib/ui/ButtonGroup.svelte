<!-- @component
A named cluster of independent buttons in a daisyUI `join`; each stays its own Tab stop.
-->
<!--
  ButtonGroup — "Save | Save as… | Discard" on a form: presentational, a
  `role="group"` with a name, no keyboard behaviour by design. For a row of
  controls that should be ONE Tab stop with arrow keys, use `Toolbar`.

  Children join the bar by taking `class="join-item"` themselves. The
  group does not reach into them through a context, so `Button` stays
  free of any group coupling.

  `items` and `item` render the buttons from data instead; with `overflow`
  too, those that don't fit move into a trailing "More" menu (`Overflow`).
  `Overflow`'s hidden measuring element is the row's last child, so the
  join's end corners are put back on the element before it.
-->
<script lang="ts" generics="T extends OverflowEntry">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import ItemsOrChildren from './ItemsOrChildren.svelte';
  import Overflow, { type OverflowEntry, type OverflowItemAttributes } from './Overflow.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Accessible name of the group ("Save options"). */
    label: string;
    /**
     * `responsive` stacks below `sm`. An overflowing group is horizontal.
     * @defaultValue `'horizontal'`
     */
    orientation?: 'horizontal' | 'vertical' | 'responsive' | undefined;
    /** The buttons, each with `class="join-item"`. Ignored when `items` and `item` are given. */
    children?: Snippet<[]> | undefined;
    /** The buttons as data, rendered by `item`: what the "More" menu shows for each, with `overflow`. */
    items?: readonly T[] | undefined;
    /** Render one of `items` as a button with `class="join-item"`, spreading the third argument onto it. */
    item?: Snippet<[T, number, OverflowItemAttributes]> | undefined;
    /**
     * Move the `items` that don't fit into a trailing "More" menu.
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
    children,
    items,
    item,
    overflow = false,
    moreLabel = 'More',
    class: className,
    ...rest
  }: Props = $props();

  const orientationClass = {
    horizontal: '',
    vertical: 'join-vertical',
    responsive: 'join-vertical sm:join-horizontal',
  } as const;

  // daisyUI's `join` rounds `:last-child`, which in an overflow row is the measuring element.
  const overflowEnd =
    '[&>:has(+[data-overflow-measurer])]:[--join-se:var(--join-r-se,var(--join-r,var(--radius-field)))] [&>:has(+[data-overflow-measurer])]:[--join-ee:var(--join-r-ee,var(--join-r,var(--radius-field)))]';
</script>

{#if overflow && items !== undefined && item !== undefined}
  <Overflow
    {...rest as HTMLAttributes<HTMLElement>}
    role="group"
    aria-label={label}
    {items}
    {item}
    {moreLabel}
    triggerClass="btn join-item"
    class={['join', overflowEnd, className]}
  />
{:else}
  <div {...rest} role="group" aria-label={label} class={['join', orientationClass[orientation], className]}>
    <ItemsOrChildren {items} {item} {children} />
  </div>
{/if}
