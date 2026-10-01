<!-- @component
A publisher or awarding institution as Schema.org microdata: "Oxford, Oxfordshire, UK: Oxford University Press".
-->
<!--
  Publisher — a publisher (or awarding institution) as Schema.org microdata:
  "Oxford, Oxfordshire, UK: Oxford University Press". The place is a
  `PostalAddress` of whichever of locality / region / country are present,
  and is omitted, colon included, when none are.

  Microdata, not ARIA: the name is plain text; the structure is for machines.
  `itemprop` defaults to `publisher` and is a prop so a thesis can credit its
  awarding institution as `sourceOrganization`.
-->
<script lang="ts">
  import type { PublisherRecord } from './csl.ts';

  interface Props {
    /** The publisher to render; its place is omitted when it has none. */
    publisher: PublisherRecord;
    /**
     * Schema.org `itemprop` on the root.
     * @defaultValue `'publisher'`
     */
    itemprop?: string | undefined;
  }

  let { publisher, itemprop = 'publisher' }: Props = $props();

  const placeParts = $derived(
    (
      [
        ['addressLocality', publisher.address?.locality],
        ['addressRegion', publisher.address?.region],
        ['addressCountry', publisher.address?.country],
      ] as const
    ).flatMap(([prop, value]) => (value === undefined || value === '' ? [] : [{ prop, value }])),
  );
</script>

<span {itemprop} itemscope itemtype={`https://schema.org/${publisher.itemtype ?? 'Organization'}`}>
  {#if placeParts.length > 0}
    <span itemprop="location" itemscope itemtype="https://schema.org/PostalAddress"
      >{#each placeParts as { prop, value }, index (prop)}<span itemprop={prop}>{value}</span
        >{#if index < placeParts.length - 1},{' '}{/if}{/each}</span
    >:
  {/if}
  <span itemprop="name">{publisher.name}</span>
</span>
