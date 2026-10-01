<!-- @component
An in-text anchor in one of three weights; the plain link of the library.
-->
<!--
  Link — an in-text anchor in one of three weights. The plain `<a>` of the
  library: everything that is a link and not an action goes through it, so
  that "what a link looks like" is one decision.

  ARIA contract: a native `<a href>`, so role, focus and activation are the
  platform's. `external` adds `target="_blank"` and `rel="noreferrer"`
  (which implies `noopener`) — the two always travel together here, because a
  new tab handed the referrer is the leak. An external link that must also
  announce the new tab wants `ExternalLink`, which carries the visually
  hidden warning; this one stays silent so it can be used mid-sentence.

  `href` resolves through the components context unless `external`: an
  absolute off-site URL is not the app's to rewrite.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { linkVariant, type LinkVariant } from './tones.ts';

  interface Props extends Omit<HTMLAnchorAttributes, 'href'> {
    /** The target; an app path is resolved through the components context. */
    href: string;
    /**
     * The link weight.
     * @defaultValue `'primary'`
     */
    variant?: LinkVariant | undefined;
    /** Open in a new tab with the safe `rel`. */
    external?: boolean | undefined;
    /** The link text. */
    children: Snippet<[]>;
  }

  let {
    href,
    variant = 'primary',
    external = false,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  const resolved = $derived(external ? href : context.href(href));
</script>

<a
  {...rest}
  href={resolved}
  target={external ? '_blank' : undefined}
  rel={external ? 'noreferrer' : undefined}
  class={[linkVariant[variant], className]}
>
  {@render children()}
</a>
