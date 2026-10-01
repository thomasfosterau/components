<!-- @component
Offset-based page navigation: numbered links with gaps or a bare Previous/Next pair, as links (`href`) or callbacks (`onPage`).
-->
<!--
  Pagination — one component for the five pagers the four apps had grown:
  numbered page links with gaps, a bare Previous/Next pair, the link form and
  the callback form.

  Two axes, and that is the whole design. `variant` chooses how much is
  drawn — `window` renders first / last / the current page's neighbours,
  `prevNext` renders the two arms and nothing else, which is what a listing
  that only knows "there is more" can honestly offer. `href` versus `onPage`
  chooses what the controls ARE: given `href` they are real links, which keeps
  Ctrl-click, middle-click and "copy link address" and works with no
  JavaScript at all; given `onPage` they are buttons, for a pager over state
  the URL does not carry. `href` wins when both are passed.

  ARIA contract: a `<nav>` named by `label`, holding a list of controls. The
  arms carry `rel="prev"` / `rel="next"`. An unavailable arm is an
  `aria-disabled` `<span>` — never a link to nowhere, and never removed, since
  a pager whose Previous disappears on page one slides Next under the reader's
  cursor. The current page is a `<span>` with `aria-current="page"` rather
  than a link to where you already are; every numbered control is named
  "Page 8" through `pageLabel`, because a bare digit is not an accessible
  name; and the gap marker is `aria-hidden`, because "…" is not information.

  In `window` mode a single page renders nothing at all — there is nothing to
  navigate — unless `showRange` asked for the range line, which is a fact
  about the result and still true. In `prevNext` mode both arms stay, disabled:
  that variant is drawn by a caller that wants its control bar to hold place.
-->
<script lang="ts">
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { buttonSize, type Size } from '../ui/tones.ts';
  import { pageWindow } from './pagination.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /** The offset the current page was rendered with. */
    offset: number;
    /** The page size the current page was rendered with. */
    limit: number;
    /** The unpaged total across every page. */
    total: number;
    /**
     * `window` renders numbered page links with gaps; `prevNext` a bare Previous/Next pair.
     * @defaultValue `'window'`
     */
    variant?: 'window' | 'prevNext' | undefined;
    /**
     * Build the link for a target offset. Preserving the page's own query
     * parameters is the caller's job — `pageHref` does it for a JSON:API
     * URL — and the result is resolved through the components context.
     */
    href?: ((offset: number) => string) | undefined;
    /** Page without navigating. Ignored when `href` is given. */
    onPage?: ((offset: number) => void) | undefined;
    /**
     * Pages rendered either side of the current one.
     * @defaultValue `1`
     */
    siblings?: number | undefined;
    /**
     * The navigation landmark's accessible name.
     * @defaultValue `'Pagination'`
     */
    label?: string | undefined;
    /**
     * Text of the previous-page control.
     * @defaultValue `'Previous'`
     */
    previousLabel?: string | undefined;
    /**
     * Text of the next-page control.
     * @defaultValue `'Next'`
     */
    nextLabel?: string | undefined;
    /**
     * How a numbered control is named — its digit alone is not a name.
     * @defaultValue `"Page <page>"`
     */
    pageLabel?: ((page: number) => string) | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'sm'`
     */
    size?: Size | undefined;
    /** Print the range line ("Showing 41–60 of 151"). */
    showRange?: boolean | undefined;
    /**
     * The range line when `showRange`.
     * @defaultValue `"Showing <start>–<end> of <total>"`
     */
    rangeLabel?: ((start: number, end: number, total: number) => string) | undefined;
    /** Text between the two arms in `prevNext` mode ("Page 2 of 8"). */
    statusLabel?: ((page: number, pages: number) => string) | undefined;
    /**
     * Locale(s) for `Intl` formatting.
     * @defaultValue the components context's `locale()`
     */
    locales?: string | readonly string[] | undefined;
  }

  let {
    offset,
    limit,
    total,
    variant = 'window',
    href,
    onPage,
    siblings = 1,
    label = 'Pagination',
    previousLabel = 'Previous',
    nextLabel = 'Next',
    pageLabel = (page) => `Page ${page}`,
    size = 'sm',
    showRange = false,
    rangeLabel,
    statusLabel,
    locales = getComponentsContext().locale(),
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();

  const view = $derived(pageWindow({ offset, limit }, total, siblings));

  // The formatter and the formatted string are separate `$derived`s so the
  // (relatively expensive) `Intl.NumberFormat` is not rebuilt when only the
  // offset moves. Counts are quantities and get grouped; the page NUMBERS
  // below are identifiers and stay bare.
  const counts = $derived(new Intl.NumberFormat(locales));
  const rangeText = $derived(
    rangeLabel === undefined
      ? `Showing ${counts.format(view.from)}–${counts.format(view.to)} of ${counts.format(total)}`
      : rangeLabel(view.from, view.to, total),
  );

  /** A target offset's href, resolved through the context. */
  const linkTo = (target: number): string | undefined =>
    href === undefined ? undefined : context.href(href(target));

  const itemClass = $derived(['btn join-item', buttonSize[size]]);
  const inertClass = $derived(['btn btn-disabled join-item', buttonSize[size]]);
</script>

{#snippet armBody(text: string, leading: boolean)}
  {#if leading}<ChevronLeft class="size-4" aria-hidden="true" />{/if}
  <span>{text}</span>
  {#if !leading}<ChevronRight class="size-4" aria-hidden="true" />{/if}
{/snippet}

{#snippet arm(target: number | undefined, text: string, rel: 'prev' | 'next', leading: boolean)}
  <li>
    {#if target === undefined}
      <span class={inertClass} aria-disabled="true">{@render armBody(text, leading)}</span>
    {:else if href !== undefined}
      <a href={linkTo(target)} {rel} class={itemClass}>{@render armBody(text, leading)}</a>
    {:else}
      <button
        type="button"
        class={itemClass}
        onclick={() => {
          onPage?.(target);
        }}
      >
        {@render armBody(text, leading)}
      </button>
    {/if}
  </li>
{/snippet}

{#if variant === 'prevNext' || view.pageCount > 1}
  <nav
    {...rest}
    aria-label={label}
    class={['flex flex-col items-center gap-2 sm:flex-row sm:justify-between', className]}
  >
    {#if showRange}
      <p class="text-base-content/70 text-sm tabular-nums">{rangeText}</p>
    {/if}
    <ul class="join">
      {@render arm(view.previous, previousLabel, 'prev', true)}
      {#if variant === 'prevNext'}
        {#if statusLabel !== undefined}
          <li>
            <span class={['btn btn-ghost join-item pointer-events-none', buttonSize[size]]}>
              {statusLabel(view.page, view.pageCount)}
            </span>
          </li>
        {/if}
      {:else}
        {#each view.items as item (item.kind === 'page' ? item.page : `gap-${item.after}`)}
          <li>
            {#if item.kind === 'gap'}
              <span class={inertClass} aria-hidden="true">…</span>
            {:else if item.current}
              <span class={['btn btn-active join-item', buttonSize[size]]} aria-current="page">
                <span class="sr-only">{pageLabel(item.page)}</span>
                <span aria-hidden="true">{item.page}</span>
              </span>
            {:else if href !== undefined}
              <a href={linkTo(item.offset)} class={itemClass} aria-label={pageLabel(item.page)}>
                <span aria-hidden="true">{item.page}</span>
              </a>
            {:else}
              <button
                type="button"
                class={itemClass}
                aria-label={pageLabel(item.page)}
                onclick={() => {
                  onPage?.(item.offset);
                }}
              >
                <span aria-hidden="true">{item.page}</span>
              </button>
            {/if}
          </li>
        {/each}
      {/if}
      {@render arm(view.next, nextLabel, 'next', false)}
    </ul>
  </nav>
{:else if showRange}
  <!-- One page, so there is nothing to navigate — but the range line is a
       fact about the result, not about the pager, and stays. A <nav> around
       it alone would be a landmark with no controls in it. -->
  <p {...rest} class={['text-base-content/70 text-sm tabular-nums', className]}>{rangeText}</p>
{/if}
