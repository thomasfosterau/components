<!-- @component
An inline reference marker that registers its source with the surrounding bibliography and renders the number it was given.
-->
<!--
  Citation — an inline reference marker that registers its source with the
  surrounding bibliography and renders the number it was given.

  Registration happens at component INITIALISATION and again in an `$effect`,
  never in a `$derived`: Svelte 5 refuses a reactive write from a derived
  expression (`state_unsafe_mutation`), and rendering the number IS what
  registers the source, so the write cannot simply move there. The init call
  is what makes the FIRST paint carry the right number; the effect is what
  keeps it right if the `citation` prop is swapped in place.

  `link link-hover` rather than a fixed colour: a hard-coded blue is invisible
  in a dark theme and ignores whatever palette the consumer's `theme.css`
  declares.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import { getBibliographyContext } from './bibliography.svelte.ts';
  import type { Citation } from './citation.ts';

  interface Props {
    /** The source being cited. */
    citation: Citation;
    /**
     * `superscript` renders `[1]` raised; `inline` renders `(1)` on the line.
     * @defaultValue `'superscript'`
     */
    format?: 'inline' | 'superscript';
    /**
     * Link to the `<ReferenceList>` entry. Off when there is no list on the page.
     * @defaultValue `true`
     */
    linkToReference?: boolean;
    /**
     * The marker's accessible name — a bare "1" announces nothing on its own.
     * @defaultValue `"Reference <n>: <title>"`
     */
    referenceLabel?: (n: number, title: string) => string;
  }

  let {
    citation,
    format = 'superscript',
    linkToReference = true,
    referenceLabel = (n, title) => `Reference ${n}: ${title}`,
  }: Props = $props();

  const manager = getBibliographyContext();
  // `untrack` says what the init call means: read the prop ONCE, for the first
  // paint, and leave staying-in-sync to the effect below. Without it Svelte
  // warns that the reference captures only the initial value — which is
  // exactly the intent, but worth stating rather than suppressing.
  let number = $state(untrack(() => manager.addCitation(citation)));
  $effect(() => {
    number = manager.addCitation(citation);
  });
  const href = $derived(`#ref-${citation.id}`);
  const label = $derived(referenceLabel(number, citation.title));
</script>

{#if format === 'superscript'}
  <sup>
    {#if linkToReference}
      <a {href} class="link link-hover no-underline" aria-label={label}>[{number}]</a>
    {:else}
      <span class="text-base-content/70" aria-label={label}>[{number}]</span>
    {/if}
  </sup>
{:else if linkToReference}
  <a {href} class="link link-hover" aria-label={label}>({number})</a>
{:else}
  <span class="text-base-content/70" aria-label={label}>({number})</span>
{/if}
