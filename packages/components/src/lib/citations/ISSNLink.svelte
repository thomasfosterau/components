<!-- @component
An ISSN rendered as a WorldCat lookup link that opens in a new tab.
-->
<!--
  ISSNLink — an ISSN rendered as a resolvable WorldCat lookup link.

  Consistent with `DOILink` / `ISBNLink`: `https://` (the old copy's
  `http://` WorldCat URL, and the old copy also dropped `target`/`rel`
  entirely — fixed here), an optional Schema.org `itemprop`, native attribute
  spread on the `<a>` itself, and a `children` snippet for a caller that
  wants to render the identifier differently (defaults to the bare ISSN).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAnchorAttributes, 'children'> {
    /** The ISSN, without a prefix. */
    issn: string;
    /**
     * Schema.org `itemprop` on the link, when the identifier is a property of an enclosing item.
     */
    itemprop?: string | undefined;
    /**
     * Replaces the link text.
     * @defaultValue the bare ISSN
     */
    children?: Snippet<[]> | undefined;
  }

  let { issn, itemprop, children, class: className, ...rest }: Props = $props();
  const href = $derived(`https://www.worldcat.org/issn/${issn}`);
</script>

<span class="whitespace-nowrap">
  ISSN
  <a
    {...rest}
    {href}
    {itemprop}
    target="_blank"
    rel="noreferrer"
    class={['link link-primary link-hover', className]}
    >{#if children}{@render children()}{:else}{issn}{/if}</a
  >
</span>
