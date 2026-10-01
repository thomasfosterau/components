<!-- @component
A journal article as "Authors, ‘Title’ (2019) <cite>Periodical</cite> 12 (3) pp 45–67", with the Schema.org article → issue → volume → periodical chain as microdata.
-->
<!--
  ScholarlyArticleCitation — a journal article as "Authors, 'Title' (2019)
  <cite>Periodical</cite> 12 (3) pp 45–67 doi ISSN", with the Schema.org
  ScholarlyArticle → PublicationIssue → PublicationVolume → Periodical chain
  as nested `isPartOf` microdata.

  The record type is local — see `./csl.ts`. Every string is a prop with an
  English default.
-->
<script lang="ts">
  import Year from '../formatting/Year.svelte';
  import CreditList from './CreditList.svelte';
  import DOILink from './DOILink.svelte';
  import ISSNLink from './ISSNLink.svelte';
  import type { ScholarlyArticleRecord } from './csl.ts';

  interface Props {
    /** The article record, with its periodical, volume and issue; absent fields are left out. */
    article: ScholarlyArticleRecord;
    /** Microdata `itemid` — the article's canonical URL. */
    itemid?: string | undefined;
    /**
     * Rendered in place of a missing title.
     * @defaultValue `'Untitled article'`
     */
    untitledLabel?: string | undefined;
    /**
     * Rendered in place of a missing date.
     * @defaultValue `'no date'`
     */
    noDateLabel?: string | undefined;
    /**
     * Abbreviation before a single page.
     * @defaultValue `'p'`
     */
    pageLabel?: string | undefined;
    /**
     * Abbreviation before a page range.
     * @defaultValue `'pp'`
     */
    pagesLabel?: string | undefined;
    /**
     * Lead-in before the record’s URL.
     * @defaultValue `'available online at'`
     */
    availableOnlineLabel?: string | undefined;
    /**
     * Locale(s) for the joined name lists.
     * @defaultValue the components context's `locale()`
     */
    locales?: string | readonly string[] | undefined;
  }

  let {
    article,
    itemid,
    untitledLabel = 'Untitled article',
    noDateLabel = 'no date',
    pageLabel = 'p',
    pagesLabel = 'pp',
    availableOnlineLabel = 'available online at',
    locales,
  }: Props = $props();

  const authors = $derived(article.authors ?? []);
</script>

<span itemscope {itemid} itemtype="https://schema.org/ScholarlyArticle">
  {#if authors.length > 0}
    <CreditList credits={authors} role="author" {locales} />,
  {/if}
  '<cite class="not-italic" itemprop="headline name">{article.title ?? untitledLabel}</cite>'
  ({#if article.datePublished !== undefined}<Year
      value={article.datePublished}
      itemprop="datePublished"
      {locales}
    />{:else}{noDateLabel}{/if})
  {#if article.periodical !== undefined || article.volumeNumber !== undefined || article.issueNumber !== undefined}
    <span itemprop="isPartOf" itemscope itemtype="https://schema.org/PublicationIssue">
      <span itemprop="isPartOf" itemscope itemtype="https://schema.org/PublicationVolume">
        {#if article.periodical?.title !== undefined}
          <span itemprop="isPartOf" itemscope itemtype="https://schema.org/Periodical">
            <cite class="italic" itemprop="name">{article.periodical.title}</cite>
          </span>
        {/if}
        {#if article.volumeNumber !== undefined}
          <span itemprop="volumeNumber">{article.volumeNumber}</span>
        {/if}
      </span>
      {#if article.issueNumber !== undefined}
        (<span itemprop="issueNumber">{article.issueNumber}</span>)
      {/if}
    </span>
  {/if}
  {#if article.pageStart !== undefined && article.pageEnd !== undefined}
    {pagesLabel} <span itemprop="pageStart">{article.pageStart}</span>–<span itemprop="pageEnd"
      >{article.pageEnd}</span
    >
  {:else if article.pageStart !== undefined}
    {pageLabel} <span itemprop="pageStart">{article.pageStart}</span>
  {/if}
  {#if article.doi !== undefined}
    <DOILink doi={article.doi} itemprop="identifier sameAs" />
  {/if}
  {#if article.periodical?.issn !== undefined}
    <ISSNLink issn={article.periodical.issn} />
  {/if}
  {#if article.url !== undefined}
    {availableOnlineLabel} <a itemprop="url" href={article.url}>{article.url}</a>
  {/if}
</span>
