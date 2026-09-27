<script lang="ts">
  /**
   * Emits one Schema.org JSON-LD graph node as a
   * `<script type="application/ld+json">` block in `<svelte:head>`.
   *
   * The JSON goes through {@link serializeJsonLd}, which escapes `<`, `>`,
   * `&`, U+2028 and U+2029, so authored content can neither close the script
   * element nor open an HTML comment inside it and inject markup. `data` of
   * `null` / `undefined` renders nothing, so a builder that
   * may have nothing to emit (a degenerate breadcrumb trail) can be wired
   * without a call-site `{#if}`.
   */
  import { serializeJsonLd, type JsonLdObject } from './json-ld.ts';

  interface Props {
    data: JsonLdObject | null | undefined;
  }

  let { data }: Props = $props();

  // The closing tag is split so neither the Svelte compiler nor an HTML
  // parser reading this file sees it as the end of the component's own
  // `<script>`.
  const open = '<script type="application/ld+json">';
  const close = '<' + '/script>';
  const block = $derived(data === null || data === undefined ? undefined : open + serializeJsonLd(data) + close);
</script>

<svelte:head>
  {#if block !== undefined}
    <!-- Escaped by serializeJsonLd: `<`, `>` and `&` cannot appear unescaped. -->
    {@html block}
  {/if}
</svelte:head>
