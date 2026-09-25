<!--
  ReportCitation — a report as "Authors, <cite>Title</cite> (2021) Canberra:
  Department of X pp 88", with Schema.org Report microdata. Same shape as
  `BookCitation` without edition, series or ISBN; a report's author and
  publisher are usually the same Organization.

  The record type is local — see `./csl.ts`. Every string is a prop with an
  English default.
-->
<script lang="ts">
  import Year from '../formatting/Year.svelte';
  import CreditList from './CreditList.svelte';
  import Publisher from './Publisher.svelte';
  import type { ReportRecord } from './csl.ts';

  interface Props {
    report: ReportRecord;
    itemid?: string | undefined;
    untitledLabel?: string | undefined;
    noDateLabel?: string | undefined;
    pageCountLabel?: string | undefined;
    availableOnlineLabel?: string | undefined;
    locales?: string | readonly string[] | undefined;
  }

  let {
    report,
    itemid,
    untitledLabel = 'Untitled report',
    noDateLabel = 'no date',
    pageCountLabel = 'pp',
    availableOnlineLabel = 'available online at',
    locales,
  }: Props = $props();

  const authors = $derived(report.authors ?? []);
</script>

<span itemscope {itemid} itemtype="https://schema.org/Report">
  {#if authors.length > 0}
    <CreditList credits={authors} role="author" {locales} />,
  {/if}
  <cite itemprop="name">{report.title ?? untitledLabel}</cite>
  <CreditList credits={report.editors ?? []} role="editor" {locales} />
  <CreditList credits={report.translators ?? []} role="translator" {locales} />
  ({#if report.datePublished !== undefined}<Year
      value={report.datePublished}
      itemprop="datePublished"
      {locales}
    />{:else}{noDateLabel}{/if})
  {#if report.publisher !== undefined}
    <Publisher publisher={report.publisher} />
  {/if}
  {#if report.numberOfPages !== undefined}
    {pageCountLabel} <span itemprop="numberOfPages">{report.numberOfPages}</span>
  {/if}
  {#if report.url !== undefined}
    {availableOnlineLabel} <a itemprop="url" href={report.url}>{report.url}</a>
  {/if}
</span>
