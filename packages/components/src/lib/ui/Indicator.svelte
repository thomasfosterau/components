<!-- @component
daisyUI's `indicator`: positions a mark (a count `Badge`, a `StatusDot`) on a corner or edge of the element it wraps.
-->
<!--
  Indicator — puts an `item` (a `Badge` count, a `StatusDot`, a "New"
  badge) on a corner or edge of `children` with daisyUI's `indicator` /
  `indicator-item`. It draws nothing of its own: the mark is whatever the
  snippet renders.

  ARIA contract: no role. The mark is positioned, not re-ordered — the DOM
  order is `children` then `item`, so a screen reader hears "Notifications,
  3", never "3, Notifications". The mark sits OUTSIDE the element it
  decorates, so for an icon button with a count, put the count in the
  button's own name too (`label="Notifications, 3 unread"`): a reader
  focusing the button never reaches the badge. A mark with no text — a dot —
  must be a `StatusDot`, whose `label` carries what the colour means.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { indicatorPlacement, type IndicatorPlacement } from './tones.ts';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The mark: a `Badge`, a `StatusDot`. */
    item: Snippet<[]>;
    /** The element the mark sits on. */
    children: Snippet<[]>;
    /**
     * Where the mark sits.
     * @defaultValue `'top-end'`
     */
    placement?: IndicatorPlacement | undefined;
  }

  let { item, children, placement = 'top-end', class: className, ...rest }: Props = $props();
</script>

<div {...rest} class={['indicator', className]}>
  {@render children()}
  <span class={['indicator-item', indicatorPlacement[placement]]}>{@render item()}</span>
</div>
