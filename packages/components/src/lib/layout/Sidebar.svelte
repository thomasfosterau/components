<!-- @component
The app shell’s navigation column: a brand mark, the primary links and an account block.
-->
<!--
  Sidebar — the app shell's standing navigation column: a brand mark at the
  top, the primary links in the middle, an account block at the bottom.

  A thin composition and nothing more. The links themselves are `MenuItem`s
  inside a `Menu`, which already owns the whole navigation
  contract — the `<nav aria-label>` landmark, the `<ul class="menu">`, and
  `aria-current="page"` on the item the reader is on. This adds only what a
  sidebar has and a menu does not.

  What it deliberately does NOT do is wrap the column in an `<aside>`, which
  is what that original did. `<aside>` is the `complementary` landmark — "content
  related to the main content, meaningful on its own" — and a site's primary
  navigation is neither. Wrapping it makes the app's most important landmark
  announce itself as an afterthought, and puts a second landmark around the
  `navigation` one, which a reader then has to step through twice.

  ARIA contract: the navigation landmark is `Menu`'s. When `title` is shown,
  it is also the landmark's accessible name by default, so the name a reader
  hears is the text a reader sees. `brand` and `footer` are plain regions: the
  brand is a link, the footer block is usually a second short `Menu`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Menu from '../ui/Menu.svelte';
  import type { HeadingLevel } from '../ui/tones.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    /**
     * Accessible name of the navigation landmark. Defaults to `title` when
     * one is shown, and to `Primary` when it is not.
     */
    label?: string | undefined;
    /** A visible heading over the links ("Browse", "Your account"). */
    title?: string | undefined;
    /**
     * The heading level, so the page outline stays intact.
     * @defaultValue `2`
     */
    headingLevel?: HeadingLevel | undefined;
    /** The brand mark, above the links. */
    brand?: Snippet<[]> | undefined;
    /** A block pinned under the links — the signed-in account menu. */
    footer?: Snippet<[]> | undefined;
    /** The `MenuItem`s. */
    children: Snippet<[]>;
  }

  let {
    label,
    title,
    headingLevel = 2,
    brand,
    footer,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const navLabel = $derived(label ?? title ?? 'Primary');
</script>

<div
  {...rest}
  class={['bg-base-100 border-base-300 flex min-h-full w-72 flex-col border-r', className]}
>
  {#if brand}
    <div class="flex h-16 shrink-0 items-center px-6">{@render brand()}</div>
  {/if}

  <div class="min-h-0 flex-1 space-y-2 px-4 py-2">
    {#if title !== undefined}
      <svelte:element
        this={`h${headingLevel}`}
        class="text-base-content/60 px-1 text-xs font-semibold tracking-wide uppercase"
      >
        {title}
      </svelte:element>
    {/if}
    <Menu label={navLabel}>{@render children()}</Menu>
  </div>

  {#if footer}
    <div class="border-base-300 shrink-0 border-t px-4 py-4">{@render footer()}</div>
  {/if}
</div>
