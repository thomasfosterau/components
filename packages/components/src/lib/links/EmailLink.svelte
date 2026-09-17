<!--
  EmailLink — a `mailto:` anchor, its query string (`subject`/`body`/`cc`/
  `bcc`) built with `URLSearchParams` so every value is correctly encoded.

  ARIA contract: none beyond the native `<a>` — the visible text (the address
  by default, or `children` when given) is the accessible name.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  interface Props extends HTMLAnchorAttributes {
    email: string;
    subject?: string | undefined;
    body?: string | undefined;
    cc?: string | undefined;
    bcc?: string | undefined;
    /** Replaces the link text; defaults to the address itself. */
    children?: Snippet<[]>;
  }

  let { email, subject, body, cc, bcc, children, class: className, ...rest }: Props = $props();

  const href = $derived.by(() => {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    if (cc) params.set('cc', cc);
    if (bcc) params.set('bcc', bcc);
    const query = params.toString();
    return `mailto:${email}${query ? `?${query}` : ''}`;
  });
</script>

<a {...rest} {href} class={['link link-primary link-hover', className]}>
  {#if children}{@render children()}{:else}{email}{/if}
</a>
