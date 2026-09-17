<!--
  PageHeader — the block at the top of a page: what the page is about, and
  what you can do to it.

  One component replacing three near-identical ones (preferenceflow's
  `PageHeader`, website's and gardeneria's `PageHeading`). The three differed
  only in which optional regions they had: website had `top`/`bottom`/
  `actions`, gardeneria added a round `icon` frame, preferenceflow added a
  typed `subtitle`. All of them are optional here, so the union costs a call
  site nothing it does not use.

  `title` takes a string OR a snippet because a page title is sometimes
  marked up — a species name in italics, a title with a `<Badge>` after it —
  and an app should not have to choose between the component and its own
  typography.

  ARIA contract: `title` is a real heading, at `headingLevel` (an `<h1>` by
  default, because this is the page's heading and a page has one). The level
  is a prop and not a consequence of the type scale: the outline is document
  structure, the scale is decoration, and `class` moves the second without
  touching the first. `actions` is a `role="group"` named by `actionsLabel`,
  so the cluster announces itself as one thing ("Page actions, group") rather
  than as loose buttons floating beside a heading. `icon` is decorative and
  hidden — it repeats what the title already says.

  The `<header>` element is a `banner` landmark only when it is NOT inside
  `<main>`, `<article>`, `<aside>`, `<nav>` or `<section>`. A page header is
  inside `Main`, so it is not a banner, which is correct: the banner is the
  site chrome (`Navbar`), of which there is one per page.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { HeadingLevel } from '../ui/tones.ts';

  // `children` is dropped from the native attributes as well as `title`: the
  // DOM typings declare it required, and here it is one of the optional
  // regions.
  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
    /** The page's heading — its own text, or a snippet for richer markup. */
    title: string | Snippet<[]>;
    /** Supporting line under the heading. */
    subtitle?: string | undefined;
    headingLevel?: HeadingLevel | undefined;
    /** Accessible name of the `actions` group. */
    actionsLabel?: string | undefined;
    /** Rendered above the heading — breadcrumbs, an eyebrow label, a badge. */
    eyebrow?: Snippet<[]> | undefined;
    /** A leading avatar or emblem, in a round frame. Decorative. */
    icon?: Snippet<[]> | undefined;
    /** Small facts under the heading — dates, counts, status. */
    meta?: Snippet<[]> | undefined;
    /** Buttons and links, aligned to the end of the heading row. */
    actions?: Snippet<[]> | undefined;
    /** Free content under the whole header block — a tab strip, a filter row. */
    children?: Snippet<[]> | undefined;
  }

  let {
    title,
    subtitle,
    headingLevel = 1,
    actionsLabel = 'Page actions',
    eyebrow,
    icon,
    meta,
    actions,
    children,
    class: className,
    ...rest
  }: Props = $props();

  // The page title's scale is the page's, not the outline's — an `<h2>` used
  // as a page heading (a panel, a dialog body) still reads as the title.
  const titleClasses = 'text-3xl font-semibold tracking-tight text-balance sm:text-4xl';
</script>

<header {...rest} class={['space-y-3', className]}>
  {#if eyebrow}
    <div class="text-base-content/70 text-sm">{@render eyebrow()}</div>
  {/if}

  <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div class="flex min-w-0 flex-1 items-start gap-x-5">
      {#if icon}
        <div class="avatar shrink-0" aria-hidden="true">
          <div class="bg-base-200 size-16 rounded-full">{@render icon()}</div>
        </div>
      {/if}
      <div class="min-w-0 flex-1 space-y-1">
        <svelte:element this={`h${headingLevel}`} class={titleClasses}>
          {#if typeof title === 'string'}
            {title}
          {:else}
            {@render title()}
          {/if}
        </svelte:element>
        {#if subtitle !== undefined}
          <p class="text-base-content/70 text-lg leading-7">{subtitle}</p>
        {/if}
        {#if meta}
          <div
            class="text-base-content/70 flex flex-col gap-2 pt-1 text-sm leading-6 sm:flex-row sm:flex-wrap sm:gap-x-6"
          >
            {@render meta()}
          </div>
        {/if}
      </div>
    </div>

    {#if actions}
      <div role="group" aria-label={actionsLabel} class="flex shrink-0 flex-wrap gap-2">
        {@render actions()}
      </div>
    {/if}
  </div>

  {#if children}
    <div>{@render children()}</div>
  {/if}
</header>
