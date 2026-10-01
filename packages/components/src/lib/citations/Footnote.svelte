<!-- @component
An inline note marker that registers its note with the surrounding footnote list, tracked separately from citations.
-->
<!--
  Footnote — an inline note marker, tracked separately from citations.

  The number is assigned AT REGISTRATION, not derived from the map's size
  after the fact — a page's first note reads `1` because registration handed
  it that ordinal, not by the accident of an effect having already run by the
  time something reads `manager.footnotes().length`. Registration happens at
  component initialisation (the first paint is already correct); an `$effect`
  re-registers afterwards, so a note whose text is edited in place stays
  current. It cannot move into a `$derived` either — Svelte 5 refuses a
  reactive write from one.
-->
<script lang="ts">
  import { getBibliographyContext } from './bibliography.svelte.ts';

  interface Props {
    /** Stable key for this note — also the `#footnote-<id>` anchor. */
    id: string;
    /** The note's text. */
    content: string;
    /** A custom marker (`*`, `†`) instead of the auto-assigned number. */
    symbol?: string;
    /**
     * The marker's accessible name — a bare number or symbol announces nothing on its own.
     * @defaultValue `"Footnote <marker>: <content>"`
     */
    footnoteLabel?: (marker: string, content: string) => string;
  }

  let {
    id,
    content,
    symbol,
    footnoteLabel = (marker, text) => `Footnote ${marker}: ${text}`,
  }: Props = $props();

  const manager = getBibliographyContext();

  /** Register, then read back the position registration gave this note. */
  const register = (): string => {
    manager.addFootnote(id, symbol === undefined ? { content } : { content, symbol });
    if (symbol !== undefined) return symbol;
    return String(manager.footnotes().findIndex(([key]) => key === id) + 1);
  };

  let marker = $state(register());
  $effect(() => {
    marker = register();
  });
  const label = $derived(footnoteLabel(marker, content));
</script>

<sup>
  <a href="#footnote-{id}" class="link link-hover no-underline" aria-label={label}>
    {marker}
  </a>
</sup>
