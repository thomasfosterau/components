<!--
  FormatList<T> — renders `items` through `Intl.ListFormat`, letting the
  `children` snippet render each element while literal text ("and", ", ")
  comes from the locale's own conjunction/disjunction rules.

  No wrapping element of its own — it emits `children(item)` and text nodes
  in sequence, so the caller controls the surrounding markup entirely.
-->
<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import { getComponentsContext } from '../context.svelte.ts';

  interface Props {
    items: readonly T[];
    style?: Intl.ListFormatOptions['style'];
    type?: Intl.ListFormatOptions['type'];
    locales?: string | readonly string[] | undefined;
    children: Snippet<[T]>;
  }

  let {
    items,
    style = 'long',
    type = 'conjunction',
    locales = getComponentsContext().locale(),
    children,
  }: Props = $props();

  const format = $derived(new Intl.ListFormat(locales, { style, type }));

  // `Intl.ListFormat` only formats strings, so format the items' *indices*
  // and map each "element" part back to the real item by index — that way
  // the snippet gets the original `T`, not its stringified form.
  const indices = $derived(items.map((_, index) => index.toString()));
  const parts = $derived(format.formatToParts(indices));
</script>

{#each parts as part, i (i)}
  {#if part.type === 'element'}
    {@render children(items[Number.parseInt(part.value, 10)] as T)}
  {:else}
    {part.value}
  {/if}
{/each}
