<!-- @component
A thesis as "Author, <cite>Title</cite> (2019) PhD thesis, University of Sydney", with Schema.org `Thesis` microdata.
-->
<!--
  ThesisCitation — a thesis as "Author, <cite>Title</cite> (2019) PhD thesis,
  University of Sydney", with Schema.org Thesis microdata. Website's
  renderer emitted only the title; the author, year, degree and awarding
  institution are the rest of what CSL's `thesis` type prints, each
  independently optional.

  The record type is local — see `./csl.ts`. Every string is a prop with an
  English default.
-->
<script lang="ts">
  import Year from '../formatting/Year.svelte';
  import CreditList from './CreditList.svelte';
  import Publisher from './Publisher.svelte';
  import type { ThesisRecord } from './csl.ts';

  interface Props {
    /** The thesis record; absent fields are left out of the rendering. */
    thesis: ThesisRecord;
    /**
     * Rendered in place of a missing title.
     * @defaultValue `'Untitled thesis'`
     */
    untitledLabel?: string | undefined;
    /**
     * Degree → its label.
     * @defaultValue `"<degree> thesis"`, or `"thesis"` without a degree
     */
    degreeLabel?: ((degree: string | undefined) => string) | undefined;
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
    thesis,
    untitledLabel = 'Untitled thesis',
    degreeLabel = (degree) => (degree === undefined ? 'thesis' : `${degree} thesis`),
    availableOnlineLabel = 'available online at',
    locales,
  }: Props = $props();

  const authors = $derived(thesis.authors ?? []);
</script>

<span itemscope itemtype="https://schema.org/Thesis">
  {#if authors.length > 0}
    <CreditList credits={authors} role="author" {locales} />,
  {/if}
  <cite itemprop="name">{thesis.title ?? untitledLabel}</cite>
  {#if thesis.datePublished !== undefined}
    (<Year value={thesis.datePublished} itemprop="datePublished" {locales} />)
  {/if}
  {#if thesis.degree !== undefined || thesis.institution !== undefined}
    <span itemprop="inSupportOf">{degreeLabel(thesis.degree)}</span>{#if thesis.institution !== undefined},
      <Publisher publisher={thesis.institution} itemprop="sourceOrganization" />
    {/if}
  {/if}
  {#if thesis.url !== undefined}
    {availableOnlineLabel} <a itemprop="url" href={thesis.url}>{thesis.url}</a>
  {/if}
</span>
