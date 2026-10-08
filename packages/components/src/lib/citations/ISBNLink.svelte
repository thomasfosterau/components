<!-- @component
An ISBN rendered as a WorldCat lookup link that opens in a new tab.
-->
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

  interface Props extends Omit<HTMLAnchorAttributes, 'children'> {
    /** The ISBN, without a prefix. */
    isbn: string;
    /**
     * Schema.org `itemprop` on the link, when the identifier is a property of an enclosing item.
     */
    itemprop?: string | undefined;
    /**
     * Replaces the link text.
     * @defaultValue the bare ISBN
     */
    children?: Snippet<[]> | undefined;
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
