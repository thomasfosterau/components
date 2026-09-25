<!--
  ChapterCitation — a chapter as "Author, 'Chapter title', in <BookCitation>
  ch 4 (pp 101–130)", with Schema.org Chapter microdata. When the record
  carries its containing `book`, that book is cited in full, nested under
  `isPartOf`; a chapter cited on its own renders without it.

  The record type is local — see `./csl.ts`. Every string is a prop with an
  English default; the book's own labels are forwarded to the nested citation.
-->
<script lang="ts">
  import BookCitation from './BookCitation.svelte';
  import CreditList from './CreditList.svelte';
  import type { ChapterRecord } from './csl.ts';

  interface Props {
    chapter: ChapterRecord;
    untitledLabel?: string | undefined;
    inLabel?: string | undefined;
    chapterLabel?: string | undefined;
    pageLabel?: string | undefined;
    pagesLabel?: string | undefined;
    locales?: string | readonly string[] | undefined;
    /** Forwarded to the nested `BookCitation`. */
    bookLabels?:
      | {
          untitledLabel?: string | undefined;
          noDateLabel?: string | undefined;
          editionLabel?: ((edition: string) => string) | undefined;
          pageCountLabel?: string | undefined;
          availableOnlineLabel?: string | undefined;
        }
      | undefined;
  }

  let {
    chapter,
    untitledLabel = 'Untitled chapter',
    inLabel = 'in',
    chapterLabel = 'ch',
    pageLabel = 'p',
    pagesLabel = 'pp',
    locales,
    bookLabels = {},
  }: Props = $props();

  const authors = $derived(chapter.authors ?? []);
</script>

<span itemscope itemtype="https://schema.org/Chapter">
  {#if authors.length > 0}
    <CreditList credits={authors} role="author" {locales} />,
  {/if}
  '<cite class="not-italic" itemprop="name">{chapter.title ?? untitledLabel}</cite>',
  {#if chapter.book !== undefined}
    {inLabel}
    <BookCitation book={chapter.book} itemprop="isPartOf" {locales} {...bookLabels} />
  {/if}
  {#if chapter.chapterNumber !== undefined}
    {chapterLabel} {chapter.chapterNumber}
  {/if}
  {#if chapter.pageStart !== undefined && chapter.pageEnd !== undefined}
    ({pagesLabel} <span itemprop="pageStart">{chapter.pageStart}</span>–<span itemprop="pageEnd"
      >{chapter.pageEnd}</span
    >)
  {:else if chapter.pageStart !== undefined}
    ({pageLabel} <span itemprop="pageStart">{chapter.pageStart}</span>)
  {/if}
</span>
