<!-- @component
The numbered bibliography a page’s `<Citation>` markers accumulated, in citation order.
-->
<!--
  ReferenceList — the numbered bibliography a page's `<Citation>` markers
  accumulated, rendered in citation order.

  Formatting happens once, in a single `$derived` over the whole list, rather
  than per-entry inside the template on every reactive change — and pulling
  it into `formatCitation` (`./citation.ts`) is what makes the style testable
  besides.

  There is no "alphabetical" style: sorting a numbered style alphabetically
  breaks the `[n]` markers already printed in the prose, so that would need to
  be a different style entirely, not a display toggle on this one.
-->
<script lang="ts">
  import { getBibliographyContext } from './bibliography.svelte.ts';
  import { formatCitation } from './citation.ts';

  interface Props {
    /**
     * Heading text.
     * @defaultValue `'References'`
     */
    title?: string | undefined;
    /**
     * Render the heading. Off when the page supplies its own.
     * @defaultValue `true`
     */
    showTitle?: boolean | undefined;
    /**
     * Heading level, for a page whose outline this list sits deeper in.
     * @defaultValue `2`
     */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  }

  let { title = 'References', showTitle = true, headingLevel = 2 }: Props = $props();

  const manager = getBibliographyContext();
  // One pass over the whole list, recomputed only when the list changes.
  const entries = $derived(
    manager.citations().map((entry) => ({
      id: entry.citation.id,
      order: entry.order,
      text: formatCitation(entry.citation),
      url: entry.citation.url,
    })),
  );
  const Heading = $derived(`h${headingLevel}` as const);
</script>

{#if entries.length > 0}
  <section class="mt-8 space-y-3">
    {#if showTitle}
      <svelte:element this={Heading} class="text-xl font-semibold">{title}</svelte:element>
    {/if}

    <ol class="space-y-2 text-sm">
      {#each entries as entry (entry.id)}
        <li id="ref-{entry.id}" class="text-base-content/80 flex gap-2 leading-relaxed">
          <span class="text-base-content/60 shrink-0 font-medium">[{entry.order}]</span>
          <span>
            {entry.text}
            {#if entry.url}
              <a class="link link-hover" href={entry.url} rel="noreferrer nofollow" target="_blank">
                {entry.url}
              </a>
            {/if}
          </span>
        </li>
      {/each}
    </ol>
  </section>
{/if}
