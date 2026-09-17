<!--
  ISBNLink — an ISBN rendered as a resolvable WorldCat lookup link.

  Consistent with `DOILink` / `ISSNLink`: `https://` (the old copy's
  `http://` WorldCat URL), `target="_blank" rel="noreferrer"`, an optional
  Schema.org `itemprop`, native attribute spread on the `<a>` itself, and a
  `children` snippet for a caller that wants to render the identifier
  differently (defaults to the bare ISBN).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  interface Props extends HTMLAnchorAttributes {
    isbn: string;
    itemprop?: string;
    children?: Snippet<[]>;
  }

  let { isbn, itemprop, children, class: className, ...rest }: Props = $props();
  const href = $derived(`https://www.worldcat.org/isbn/${isbn}`);
</script>

<span class="whitespace-nowrap">
  ISBN
  <a
    {...rest}
    {href}
    {itemprop}
    target="_blank"
    rel="noreferrer"
    class={['link link-primary link-hover', className]}
    >{#if children}{@render children()}{:else}{isbn}{/if}</a
  >
</span>
