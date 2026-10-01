<!-- @component
Best-effort client-side highlighting of query tokens in a search result.
-->
<!--
  Highlight — best-effort client-side token highlight for search results.

  Splits `query` on whitespace, escapes regex metacharacters, and wraps
  case-insensitive matches in `<mark>`. Intentionally naive: no stemming, no
  FTS-aware tokenisation, no diacritic folding — the authoritative match is
  whatever server-side search produced (#243 on Website, where this component
  originated); this is a UX nicety, and its highlights should not be read as
  "this is exactly what full-text search matched".
-->
<script lang="ts" module>
  function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  interface Segment {
    text: string;
    match: boolean;
  }

  export function tokenise(text: string, query: string): Segment[] {
    const tokens = query
      .trim()
      .split(/\s+/)
      .filter((token) => token.length > 0)
      .map(escapeRegex);
    if (tokens.length === 0 || text.length === 0) {
      return [{ text, match: false }];
    }
    // `String.prototype.split` with a single capturing group interleaves the
    // captured matches into the result at odd indices: [before, match,
    // between, match, …]. Read `match` from that index parity rather than
    // re-testing each segment — testing each part against a *global* regex
    // would leave `lastIndex` advanced on non-matching segments, which can
    // misclassify later segments and drop highlights. Map first (parity is
    // meaningful on the raw split array), then filter empties.
    const pattern = new RegExp(`(${tokens.join('|')})`, 'gi');
    return text
      .split(pattern)
      .map((part, index) => ({ text: part, match: index % 2 === 1 }))
      .filter((segment) => segment.text.length > 0);
  }
</script>

<script lang="ts">
  interface Props {
    /** The full text to render. */
    text: string;
    /** The user's search query. Tokens are highlighted within `text`. */
    query: string;
  }

  const { text, query }: Props = $props();
  const segments = $derived(tokenise(text, query));
</script>

{#each segments as segment, i (i)}
  {#if segment.match}
    <mark class="bg-warning/30 text-base-content rounded-sm px-0.5">{segment.text}</mark>
  {:else}{segment.text}{/if}
{/each}
