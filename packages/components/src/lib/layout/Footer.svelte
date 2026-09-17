<!--
  Footer — the site footer: a `contentinfo` landmark holding the columns of
  links an app puts at the bottom of every page, and an optional `aside` for
  the brand block and the attribution notices (a data licence, a copyright
  line) that belong beside them rather than in them.

  ARIA contract: `<footer>` at the top of the document is the `contentinfo`
  landmark — the one a screen-reader user jumps to for "the small print".
  There is one per page, so a footer INSIDE an `<article>` or a `<section>` is
  not this component. `aside` renders first, which is where the attribution
  block reads: the columns are navigation, and navigation should not be
  preceded by nothing.

  Structure only. The columns are the app's — typically `<nav>` blocks with a
  `footer-title` heading each, which is what makes daisyUI's grid line up.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The columns — `<nav>` blocks with `footer-title` headings. */
    children: Snippet<[]>;
    /** Brand and attribution block, rendered before the columns. */
    aside?: Snippet<[]> | undefined;
  }

  let { children, aside, class: className, ...rest }: Props = $props();
</script>

<footer
  {...rest}
  class={['footer sm:footer-horizontal bg-base-200 text-base-content mt-auto p-10', className]}
>
  {#if aside}
    <aside>{@render aside()}</aside>
  {/if}
  {@render children()}
</footer>
