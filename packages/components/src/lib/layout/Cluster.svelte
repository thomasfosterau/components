<!-- @component
Inline items that wrap onto new lines with a token gap: a row of tags or buttons.
-->
<!--
  Cluster — "every-layout"'s Cluster, Compose's `FlowRow`: items in a row
  that wraps, with the same gap between rows as between items. With
  `as="ul"` / `"ol"` it is a list (`role="list"` restored; children `<li>`).
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
    /**
     * Space between items and between rows.
     * @defaultValue `'sm'`
     */
    gap?: Gap | undefined;
    /**
     * Cross-axis alignment.
     * @defaultValue `'center'`
     */
    align?: FlowAlign | undefined;
    /** Main-axis distribution. */
    justify?: FlowJustify | undefined;
    /**
     * The element. With `'ul'` / `'ol'`, children must be `<li>`s.
     * @defaultValue `'div'`
     */
    as?: FlowElement | undefined;
    children: Snippet<[]>;
  }

  let {
    gap = 'sm',
    align = 'center',
    justify,
    as = 'div',
    children,
    class: className,
    ...rest
  }: Props = $props();

  const list = $derived(as === 'ul' || as === 'ol');
</script>

<svelte:element
  this={as}
  {...rest}
  role={list ? 'list' : rest.role}
  class={[
    'flex flex-wrap',
    gapClass[gap],
    alignClass[align],
    justify !== undefined && justifyClass[justify],
    list && 'list-none',
    className,
  ]}
>
  {@render children()}
</svelte:element>
