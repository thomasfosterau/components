<!--
  DOILink — a DOI rendered as a resolvable `https://doi.org/<doi>` link.

  Consistent with `ISBNLink` / `ISSNLink`: `https://` (not the old copy's
  `http://` WorldCat links the other two carried), `target="_blank" rel=
  "noreferrer"`, an optional Schema.org `itemprop`, native attribute spread on
  the `<a>` itself, and a `children` snippet for a caller that wants to
  render the identifier differently (defaults to the bare DOI).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  interface Props extends HTMLAnchorAttributes {
    doi: string;
    itemprop?: string;
    children?: Snippet<[]>;
  }

  let { doi, itemprop, children, class: className, ...rest }: Props = $props();
  const href = $derived(`https://doi.org/${doi}`);
</script>

<span class="whitespace-nowrap">
  doi:<a
    {...rest}
    {href}
    {itemprop}
    target="_blank"
    rel="noreferrer"
    class={['link link-primary link-hover', className]}
    >{#if children}{@render children()}{:else}{doi}{/if}</a
  >
</span>
