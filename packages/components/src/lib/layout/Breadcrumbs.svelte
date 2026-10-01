<!-- @component
The ancestor trail above a page title, as daisyUI `breadcrumbs` inside a labelled navigation landmark.
-->
<!--
  Breadcrumbs — the ancestor trail above a page title, as daisyUI's
  `breadcrumbs` inside a labelled navigation landmark.

  ARIA contract: a `<nav aria-label>` wrapping an `<ol>`, because a trail is
  ordered and the order is the meaning — "Home, then Elections, then this".
  Ancestors are links; the TRAILING crumb is rendered as text and carries
  `aria-current="page"`, even when the caller gave it an `href`. A link to the
  page you are already on is a link that does nothing, and `aria-current` is
  what says "this is where you are" to someone who cannot see the trail.

  `item` lets a caller render a crumb's contents themselves — an icon beside
  the label, a `<Badge>`, a truncated middle. The `<li>` and the
  `aria-current` stay this component's either way: when `item` is supplied the
  attribute moves to the `<li>`, so the contract holds whatever the snippet
  renders inside it.

  Hrefs resolve through the components context, so a base path or a locale
  prefix is applied once by the app rather than at every call site.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import type { Crumb } from './types.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** Ordered ancestors, ending with the current page. */
    items: readonly Crumb[];
    /**
     * Accessible name of the navigation landmark.
     * @defaultValue `'Breadcrumb'`
     */
    label?: string | undefined;
    /** Render one crumb's contents. The `<li>` wrapper is still this component's. */
    item?: Snippet<[Crumb, number]> | undefined;
  }

  let { items, label = 'Breadcrumb', item, class: className, ...rest }: Props = $props();

  const context = getComponentsContext();
</script>

<nav
  {...rest}
  aria-label={label}
  class={['breadcrumbs text-base-content/70 text-sm', className]}
>
  <ol>
    {#each items as crumb, index (index)}
      {@const current = index === items.length - 1}
      {#if item}
        <li aria-current={current ? 'page' : undefined}>{@render item(crumb, index)}</li>
      {:else}
        <li>
          {#if crumb.href !== undefined && !current}
            <a href={context.href(crumb.href)} class="link link-hover">{crumb.label}</a>
          {:else}
            <span class="text-base-content" aria-current={current ? 'page' : undefined}>
              {crumb.label}
            </span>
          {/if}
        </li>
      {/if}
    {/each}
  </ol>
</nav>
