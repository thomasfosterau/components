<!-- @component
A `mailto:` link whose subject, body, cc and bcc are correctly encoded.
-->
<!--
  EmailLink — a `mailto:` anchor, its query string (`subject`/`body`/`cc`/
  `bcc`) built with `URLSearchParams` so every value is correctly encoded.

  ARIA contract: none beyond the native `<a>` — the visible text (the address
  by default, or `children` when given) is the accessible name.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAnchorAttributes, 'children'> {
    /** The address; also the link text unless `children` replaces it. */
    email: string;
    /** Pre-filled subject line. */
    subject?: string | undefined;
    /** Pre-filled message body. */
    body?: string | undefined;
    /** Address to copy. */
    cc?: string | undefined;
    /** Address to blind-copy. */
    bcc?: string | undefined;
    /** Replaces the link text; defaults to the address itself. */
    children?: Snippet<[]> | undefined;
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
