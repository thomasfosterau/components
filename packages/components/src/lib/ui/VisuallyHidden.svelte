<!-- @component
Content for assistive technology only: in the DOM and the accessibility tree, clipped out of the visual rendering.
-->
<!--
  VisuallyHidden — content for assistive technology only: present in the
  accessibility tree and in the DOM, clipped out of the visual rendering.

  The canonical use is a name for something conveyed graphically — an icon-only
  button, a star rating, a status dot — so that what a screen reader announces
  matches what a sighted reader sees, rather than `aria-label` guessing at it.
  Use it for content that must be READ. Content that must merely be reachable
  (a skip link) wants `sr-only focus:not-sr-only` instead, which this component
  supports because the caller's `class` is merged last by Svelte's class array.

  The clipping itself is Tailwind's `sr-only` utility, which this package does
  NOT ship — it comes from the consumer's Tailwind build, the same as every
  other class here. See the README's `@source` note.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    /** What assistive technology reads; any inline markup. */
    children: Snippet<[]>;
  }

  let { children, class: className, ...rest }: Props = $props();
</script>

<span {...rest} class={['sr-only', className]}>{@render children()}</span>
