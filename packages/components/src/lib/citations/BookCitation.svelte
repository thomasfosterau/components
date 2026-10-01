<!-- @component
One book as a compact author–date reference with Schema.org `Book` microdata.
-->
<!--
  BookCitation — one book as a compact author–date reference with Schema.org
  microdata: "Le Guin, <cite>The Left Hand of Darkness</cite> (3rd edition:
  1969) Hainish Cycle New York: Ace Books pp 304".

  Every arm is optional and independently absent: a record that carries only
  a title renders only a title (and "no date"). Contributors are RESOLVED
  credits in credit order (`CreditList`), never re-sorted. The record type is
  local — see `./csl.ts` for why and what it will align with.

  Every string is a prop with an English default.
-->
<script lang="ts">
  import Year from '../formatting/Year.svelte';
  import CreditList from './CreditList.svelte';
  import ISBNLink from './ISBNLink.svelte';
  import Publisher from './Publisher.svelte';
  import type { BookRecord } from './csl.ts';

  interface Props {
    /** The book to cite. */
    book: BookRecord;
    /** Microdata `itemprop` on the root, when this book is itself a property (a chapter's `isPartOf`). */
    itemprop?: string | undefined;
    /**
     * Rendered in place of a missing title.
     * @defaultValue `'Untitled book'`
     */
    untitledLabel?: string | undefined;
    /**
     * Rendered in place of a missing date.
     * @defaultValue `'no date'`
     */
    noDateLabel?: string | undefined;
    /**
     * How an edition is named.
     * @defaultValue `"<edition> edition"`
     */
    editionLabel?: ((edition: string) => string) | undefined;
    /**
     * Abbreviation after a page count.
     * @defaultValue `'pp'`
     */
    pageCountLabel?: string | undefined;
    /**
     * Lead-in before the record’s URL.
     * @defaultValue `'available online at'`
     */
    availableOnlineLabel?: string | undefined;
    /** Locale(s) for the joined name lists; omitted, the components context's `locale()`. */
    locales?: string | readonly string[] | undefined;
  }

  let {
    book,
    itemprop,
    untitledLabel = 'Untitled book',
    noDateLabel = 'no date',
    editionLabel = (edition) => `${edition} edition`,
    pageCountLabel = 'pp',
    availableOnlineLabel = 'available online at',
    locales,
  }: Props = $props();

  const authors = $derived(book.authors ?? []);
</script>

<span {itemprop} itemscope itemtype="https://schema.org/Book">
  {#if authors.length > 0}
    <CreditList credits={authors} role="author" {locales} />,
  {/if}
  <cite itemprop="name">{book.title ?? untitledLabel}</cite>
  <CreditList credits={book.editors ?? []} role="editor" {locales} />
  <CreditList credits={book.translators ?? []} role="translator" {locales} />
  ({#if book.edition !== undefined}{editionLabel(book.edition)}:{' '}{/if}{#if book.datePublished !== undefined}<Year
      value={book.datePublished}
      itemprop="datePublished"
      {locales}
    />{:else}{noDateLabel}{/if})
  {#if book.series !== undefined}
    <span itemprop="isPartOf" itemscope itemtype="https://schema.org/BookSeries">
      <cite class="italic" itemprop="name">{book.series.name}</cite>
    </span>
  {/if}
  {#if book.publisher !== undefined}
    <Publisher publisher={book.publisher} />
  {/if}
  {#if book.numberOfPages !== undefined}
    {pageCountLabel} <span itemprop="numberOfPages">{book.numberOfPages}</span>
  {/if}
  {#if book.url !== undefined}
    {availableOnlineLabel} <a itemprop="url" href={book.url}>{book.url}</a>
  {/if}
  {#if book.isbn !== undefined}
    <ISBNLink isbn={book.isbn} itemprop="isbn" />
  {/if}
</span>
