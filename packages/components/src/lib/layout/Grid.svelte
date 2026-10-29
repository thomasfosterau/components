<!-- @component
A responsive grid sized by the narrowest an item may get, not by breakpoints.
-->
<!--
  Grid — `repeat(auto-fill, minmax(<minItem>, 1fr))` (SwiftUI
  `LazyVGrid(.adaptive(minimum:))`, Chakra `minChildWidth`): as many columns
  as fit items at least `minItem` wide, so a card grid reflows by the space
  it actually has, inside a sidebar or out. With `as="ul"` / `"ol"` it is a
  list (`role="list"` restored; children `<li>`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { gapClass, minItemClass, type FlowElement, type Gap, type MinItem } from './space.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    /**
     * The narrowest an item gets before the grid drops a column: `xs` 10rem,
     * `sm` 12rem, `md` 16rem, `lg` 20rem.
     * @defaultValue `'md'`
     */
    minItem?: MinItem | undefined;
    /**
     * Space between items.
     * @defaultValue `'md'`
     */
    gap?: Gap | undefined;
    /**
     * The element. With `'ul'` / `'ol'`, children must be `<li>`s.
     * @defaultValue `'div'`
     */
    as?: FlowElement | undefined;
    children: Snippet<[]>;
  }

  let { minItem = 'md', gap = 'md', as = 'div', children, class: className, ...rest }: Props = $props();

  const list = $derived(as === 'ul' || as === 'ol');
</script>

<svelte:element
  this={as}
  {...rest}
  role={list ? 'list' : rest.role}
  class={['grid', minItemClass[minItem], gapClass[gap], list && 'list-none', className]}
>
  {@render children()}
</svelte:element>
