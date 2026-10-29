<!-- @component
The count line and the pager that sit under a paginated index page.
-->
<!--
  PaginationFooter — what sits under a paginated index page: the count, and
  the pager.

  The two always travel together, and rendering them separately at each call
  site meant the same dozen lines in every listing — a dozen lines in which
  the limit, the offset and the total are threaded through twice and can
  disagree. Here they come from one set of props, so they cannot.

  `ResultCount` and `Pagination` stay exported on their own: a page that shows
  a count without paging, or pages without a count, is a real thing. This is
  the pairing, not a replacement.

  ARIA contract: whatever its two parts carry — a `<p>` and a labelled `<nav>`.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Size } from '../ui/tones.ts';
  import Pagination from './Pagination.svelte';
  import ResultCount from './ResultCount.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Rows on this page — the length of what was rendered. */
    shown: number;
    /** The offset this page was rendered with. */
    offset: number;
    /** The page size this page was rendered with. */
    limit: number;
    /** The unpaged total. */
    total: number;
    /** Build the link for a target offset; the page's own query parameters included. */
    href?: ((offset: number) => string) | undefined;
    /** Page without navigating. Ignored when `href` is given. */
    onPage?: ((offset: number) => void) | undefined;
    /**
     * `window` renders numbered page links with gaps; `prevNext` a bare Previous/Next pair.
     * @defaultValue `'window'`
     */
    variant?: 'window' | 'prevNext' | undefined;
    /**
     * Pages rendered either side of the current one.
     * @defaultValue `1`
     */
    siblings?: number | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'sm'`
     */
    size?: Size | undefined;
    /**
     * The pager landmark's accessible name.
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
    /** How a numbered control is named; see `Pagination`. */
    pageLabel?: ((page: number) => string) | undefined;
    /** Passed to `Pagination`: how a page number's visible digits are written. */
    formatPage?: ((page: number) => string) | undefined;
    /** The count line, when "Showing x of y" is not the sentence wanted. */
    countLabel?: ((shown: number, total: number) => string) | undefined;
    /**
     * Locale(s) for `Intl` formatting.
     * @defaultValue the components context's `locale()`
     */
    locales?: string | readonly string[] | undefined;
  }

  let {
    shown,
    offset,
    limit,
    total,
    href,
    onPage,
    variant = 'window',
    siblings = 1,
    size = 'sm',
    label = 'Pagination',
    previousLabel = 'Previous',
    nextLabel = 'Next',
    pageLabel,
    formatPage,
    countLabel,
    locales,
    class: className,
    ...rest
  }: Props = $props();
</script>

<div {...rest} class={['space-y-4', className]}>
  <ResultCount {shown} {total} label={countLabel} {locales} />
  <Pagination
    {offset}
    {limit}
    {total}
    {variant}
    {href}
    {onPage}
    {siblings}
    {size}
    {label}
    {previousLabel}
    {nextLabel}
    {pageLabel}
    {formatPage}
    {locales}
  />
</div>
