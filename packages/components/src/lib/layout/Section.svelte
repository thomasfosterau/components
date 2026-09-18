<!--
  Section — a titled block of a page: a heading, an optional count beside it,
  optional actions opposite, and either the rows or an honest empty state.

  Every detail page is a stack of these ("Editions of this book", "The taxa
  recorded with this organ"), and website and gardeneria had one each —
  `InboundSection` and `DetailSection` — that differed only in which optional
  parts they carried. The eight lines were copied per section in the apps,
  and eight copies is eight places to forget the empty state, which renders as
  a section that looks broken rather than one that is honestly empty.

  `count` is deliberately separate from the rows: a section shows a preview
  (the first fifty) beside the real unpaged total, so the two numbers differ
  and the heading has to say the second one. It is formatted through `Intl`,
  so a five-figure count reads as `12,480` in the reader's locale.

  ARIA contract: a `<section aria-labelledby>` pointing at its own heading, so
  it is a named `region` — a landmark a reader can jump between, which is the
  whole reason a long detail page is cut into sections. The heading is real
  and at `headingLevel`, defaulting to `<h2>` (one level under the page's
  `<h1>`). `headingId` defaults to a slug of `title`, which makes the section
  addressable by URL fragment and is stable across server and client render.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { slugify } from '../ui/slug.ts';
  import type { HeadingLevel } from '../ui/tones.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The section's heading. */
    title: string;
    headingLevel?: HeadingLevel | undefined;
    /**
     * Explicit heading id. Defaults to a slug of `title`, so the section is
     * addressable; pass one when two sections on a page share a title.
     */
    headingId?: string | undefined;
    /** The unpaged total, rendered beside the heading. */
    count?: number | undefined;
    /** A line under the heading saying what the section contains. */
    description?: string | undefined;
    /** Whether there is anything to show. Drives the empty state. */
    empty?: boolean | undefined;
    /** The default empty state's text. */
    emptyMessage?: string | undefined;
    /** `Intl` locales for `count`; falls back to the context's. */
    locales?: string | readonly string[] | undefined;
    /** A "see all" link or an "add" button, opposite the heading. */
    actions?: Snippet<[]> | undefined;
    /** Replaces the default empty paragraph — usually an `EmptyState`. */
    emptyState?: Snippet<[]> | undefined;
    children: Snippet<[]>;
  }

  let {
    title,
    headingLevel = 2,
    headingId,
    count,
    description,
    empty = false,
    emptyMessage = 'Nothing here yet.',
    locales,
    actions,
    emptyState,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  const fallbackId = $props.id();
  // A title of nothing but punctuation slugs to `''`, which is not an id —
  // fall back to a generated one rather than emit `aria-labelledby=""`.
  const slugged = $derived(slugify(title));
  const resolvedHeadingId = $derived(headingId ?? (slugged === '' ? fallbackId : slugged));

  // The PERF-CPU-003 shape: the formatter is built in one `$derived` and only
  // `.format()` runs in the next, so re-rendering a count does not re-resolve
  // the locale data.
  const formatter = $derived(new Intl.NumberFormat(locales ?? context.locale()));
  const formattedCount = $derived(count === undefined ? undefined : formatter.format(count));
</script>

<section {...rest} aria-labelledby={resolvedHeadingId} class={['space-y-3', className]}>
  <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
    <svelte:element
      this={`h${headingLevel}`}
      id={resolvedHeadingId}
      class="scroll-mt-16 text-xl font-semibold sm:text-2xl"
    >
      {title}
      {#if formattedCount !== undefined}
        <span class="text-base-content/60 text-base font-normal">({formattedCount})</span>
      {/if}
    </svelte:element>
    {#if actions}
      <div class="flex shrink-0 flex-wrap gap-2">{@render actions()}</div>
    {/if}
  </div>

  {#if description !== undefined}
    <p class="text-base-content/70 text-sm leading-6">{description}</p>
  {/if}

  {#if empty}
    {#if emptyState}
      {@render emptyState()}
    {:else}
      <p class="text-base-content/60">{emptyMessage}</p>
    {/if}
  {:else}
    {@render children()}
  {/if}
</section>
