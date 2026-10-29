<!-- @component
Overlapping cards or images on daisyUI `stack`: only the top item is exposed, the rest are visual depth.
-->
<!--
  Stack — a pile with a peek of what is behind: a "3 photos" thumbnail, a
  collapsed pile of notifications. The first item is on top.

  The rule this component exists for: daisyUI's `stack` only paints the
  items behind; every child stays in the DOM, so a screen reader would read
  all three cards and Tab would land on links hidden behind the top one.
  So every item after the first is `inert` (not focusable, not clickable)
  and `aria-hidden` (not read). The depth is then reported in words: the top
  item ends with a visually hidden `countLabel(count)` ("3 items") whenever
  there is more than one, so it is not visual-only.

  The items are data, not children: `stack.css` positions them with
  `.stack > *:nth-child(n)`, so each must be a direct child of the root and
  no wrapper (not even `display: contents`) can group the ones behind.
-->
<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { stackDirection, type StackDirection } from './tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The items, top first. Only the first is exposed; the rest are depth. */
    items: readonly T[];
    /** Draws one item; `top` is true for the first. */
    item: Snippet<[item: T, top: boolean]>;
    /**
     * Which side the items behind peek out from.
     * @defaultValue `'bottom'`
     */
    direction?: StackDirection | undefined;
    /**
     * Total count when more exist than are passed (3 shown of 12).
     * @defaultValue `items.length`
     */
    count?: number | undefined;
    /**
     * Words for the depth, read after the top item.
     * @defaultValue `(n) => \`${n} items\``
     */
    countLabel?: ((count: number) => string) | undefined;
  }

  let {
    items,
    item,
    direction = 'bottom',
    count,
    countLabel = (n: number) => `${n} items`,
    class: className,
    ...rest
  }: Props = $props();

  const total = $derived(count ?? items.length);
</script>

<div {...rest} class={['stack', stackDirection[direction], className]}>
  {#each items as entry, index (index)}
    {#if index === 0}
      <div>
        {@render item(entry, true)}
        {#if total > 1}<span class="sr-only">{countLabel(total)}</span>{/if}
      </div>
    {:else}
      <div inert aria-hidden="true">{@render item(entry, false)}</div>
    {/if}
  {/each}
</div>
