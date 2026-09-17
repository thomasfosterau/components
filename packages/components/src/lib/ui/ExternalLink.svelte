<!--
  ExternalLink — a link off the site, with the `rel` decision made for the
  call site.

  The `rel` is the reason this is a component and not four lines of markup.
  An address a member typed into their own profile is untrusted outbound
  linkage and carries `nofollow`; a resolver URL the site itself composed
  from a recorded identifier (an ORCID, a DOI) is not, and carries only
  `noreferrer`. The distinction is invisible when it is wrong, which is
  exactly the kind of thing that should not be retyped per page. Hence
  `untrusted` defaults to `true`: the safe answer is the one you get by not
  thinking about it.

  ARIA contract: `target="_blank"` always pairs with `noreferrer`, and the
  new tab is ANNOUNCED — a visually hidden "(opens in a new tab)" after the
  text, so a screen-reader user learns what a sighted user learns from the
  icon. The icon itself is `aria-hidden`; it says nothing the text does not.
-->
<script lang="ts">
  import { ExternalLink as ExternalLinkIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { linkVariant, type LinkVariant } from './tones.ts';
  import VisuallyHidden from './VisuallyHidden.svelte';

  interface Props extends Omit<HTMLAnchorAttributes, 'href'> {
    href: string;
    variant?: LinkVariant | undefined;
    /**
     * Whether the destination is user-supplied. `true` (the default) adds
     * `nofollow`; pass `false` only for an address this site composed itself.
     */
    untrusted?: boolean | undefined;
    /** Show the trailing new-tab icon. */
    showIcon?: boolean | undefined;
    /** The announcement appended to the link text, for assistive technology. */
    newTabLabel?: string | undefined;
    children: Snippet<[]>;
  }

  let {
    href,
    variant = 'muted',
    untrusted = true,
    showIcon = true,
    newTabLabel = '(opens in a new tab)',
    children,
    class: className,
    ...rest
  }: Props = $props();
</script>

<a
  {...rest}
  {href}
  target="_blank"
  rel={untrusted ? 'noreferrer nofollow' : 'noreferrer'}
  class={['inline-flex items-center gap-1', linkVariant[variant], className]}
>
  {@render children()}
  <VisuallyHidden>{newTabLabel}</VisuallyHidden>
  {#if showIcon}<ExternalLinkIcon class="size-3.5 shrink-0" aria-hidden="true" />{/if}
</a>
