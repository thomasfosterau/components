<!--
  FootnoteList — the notes a page's `<Footnote>` markers registered, in
  registration order.

  Keyed by the note's own id, so a re-render does not re-create every `<li>`.
-->
<script lang="ts">
  import { getBibliographyContext } from './bibliography.svelte.ts';

  interface Props {
    /** Heading text. */
    title?: string;
    /** Render the heading. Off when the page supplies its own. */
    showTitle?: boolean;
    /** Heading level, for a page whose outline this list sits deeper in. */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  }

  let { title = 'Notes', showTitle = true, headingLevel = 2 }: Props = $props();

  const manager = getBibliographyContext();
  const notes = $derived(
    manager.footnotes().map(([id, note], index) => ({
      id,
      marker: note.symbol ?? String(index + 1),
      content: note.content,
    })),
  );
  const Heading = $derived(`h${headingLevel}` as const);
</script>

{#if notes.length > 0}
  <section class="border-base-300 mt-8 space-y-3 border-t pt-4">
    {#if showTitle}
      <svelte:element this={Heading} class="text-lg font-semibold">{title}</svelte:element>
    {/if}

    <ol class="space-y-1 text-sm">
      {#each notes as note (note.id)}
        <li id="footnote-{note.id}" class="text-base-content/80 flex gap-2">
          <span class="text-base-content/60 shrink-0 font-medium">{note.marker}.</span>
          <span>{note.content}</span>
        </li>
      {/each}
    </ol>
  </section>
{/if}
