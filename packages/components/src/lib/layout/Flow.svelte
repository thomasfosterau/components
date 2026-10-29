<!-- @component
The flex flow `VStack` and `HStack` share; internal, not exported.
-->
<!--
  Flow — one template for both stacks, so their tokens, list semantics and
  dividers cannot drift. No `reverse` option, deliberately: a visual order
  that contradicts the DOM order breaks WCAG 1.3.2 (meaningful sequence).

  `as="ul"` / `"ol"` adds `role="list"`: Safari drops list semantics from a
  list styled `list-style: none`. Its children must be `<li>`s. `divider`
  draws a rule between children (Tailwind's `divide-*`, on the borders
  between siblings, never around them); it is decorative, like a
  `Divider` with `decorative`, and adds nothing to the accessibility tree.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    alignClass,
    gapClass,
    justifyClass,
    type FlowAlign,
    type FlowElement,
    type FlowJustify,
    type Gap,
  } from './space.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    direction: 'vertical' | 'horizontal' | 'responsive';
    gap?: Gap | undefined;
    align?: FlowAlign | undefined;
    justify?: FlowJustify | undefined;
    divider?: boolean | undefined;
    as?: FlowElement | undefined;
    children: Snippet<[]>;
  }

  let {
    direction,
    gap = 'md',
    align,
    justify,
    divider = false,
    as = 'div',
    children,
    class: className,
    ...rest
  }: Props = $props();

  const directionClass = {
    vertical: 'flex-col',
    horizontal: 'flex-row',
    responsive: 'flex-col sm:flex-row',
  } as const;
  const dividerClass = {
    vertical: 'divide-base-300 divide-y',
    horizontal: 'divide-base-300 divide-x',
    responsive: 'divide-base-300 divide-y sm:divide-x sm:divide-y-0',
  } as const;
  const list = $derived(as === 'ul' || as === 'ol');
</script>

<svelte:element
  this={as}
  {...rest}
  role={list ? 'list' : rest.role}
  class={[
    'flex',
    directionClass[direction],
    gapClass[gap],
    align !== undefined && alignClass[align],
    justify !== undefined && justifyClass[justify],
    divider && dividerClass[direction],
    list && 'list-none',
    className,
  ]}
>
  {@render children()}
</svelte:element>
