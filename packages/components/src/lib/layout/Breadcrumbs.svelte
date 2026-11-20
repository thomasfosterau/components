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

  `overflow` collapses the middle crumbs into a "…" menu (named
  `moreLabel`) when the trail doesn't fit, through `Overflow`: the first
  crumb and the current page always stay, and the hidden crumbs keep their
  order in the menu. With a custom `item`, `aria-current` then sits on a
  `<span>` around it, since `Overflow` owns the `<li>`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import Overflow from '../ui/Overflow.svelte';
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
    /**
     * Collapse the middle crumbs into a menu when the trail doesn't fit on one line.
     * @defaultValue `false`
     */
    overflow?: boolean | undefined;
    /**
     * Names the "…" button that holds the collapsed crumbs.
     * @defaultValue `'Show path'`
     */
    moreLabel?: string | undefined;
  }

  let {
    items,
    label = 'Breadcrumb',
    item,
    overflow = false,
    moreLabel = 'Show path',
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();

  const entries = $derived(
    items.map((crumb, index) => ({
      id: String(index),
      label: crumb.label,
      href: crumb.href,
      current: index === items.length - 1,
      crumb,
    })),
  );
</script>

{#snippet overflowCrumb(entry: (typeof entries)[number], index: number)}
  {#if item}
    <span aria-current={entry.current ? 'page' : undefined}>{@render item(entry.crumb, index)}</span>
  {:else}
    {@render contents(entry.crumb, entry.current)}
  {/if}
{/snippet}

{#snippet contents(crumb: Crumb, current: boolean)}
  {#if crumb.href !== undefined && !current}
    <a href={context.href(crumb.href)} class="link link-hover">{crumb.label}</a>
  {:else}
    <span class="text-base-content" aria-current={current ? 'page' : undefined}>{crumb.label}</span>
  {/if}
{/snippet}

<nav
  {...rest}
  aria-label={label}
  class={['breadcrumbs text-base-content/70 text-sm', className]}
>
  {#if overflow}
    <Overflow
      element="ol"
      items={entries}
      collapseFrom="middle"
      minVisible={2}
      {moreLabel}
      moreText="…"
      triggerClass="link link-hover"
      item={overflowCrumb}
    />
  {:else}
    <ol>
      {#each items as crumb, index (index)}
        {@const current = index === items.length - 1}
        {#if item}
          <li aria-current={current ? 'page' : undefined}>{@render item(crumb, index)}</li>
        {:else}
          <li>{@render contents(crumb, current)}</li>
        {/if}
      {/each}
    </ol>
  {/if}
</nav>
