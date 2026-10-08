<!-- @component
Renders `items` through `Intl.ListFormat`, with each item drawn by the `children` snippet and the joining words from the locale.
-->
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
    /** The items to join, each rendered by `children`. */
    items: readonly T[];
    /**
     * `Intl.ListFormat` style.
     * @defaultValue `'long'`
     */
    style?: Intl.ListFormatOptions['style'] | undefined;
    /**
     * `Intl.ListFormat` type.
     * @defaultValue `'conjunction'`
     */
    type?: Intl.ListFormatOptions['type'] | undefined;
    /**
     * Locale(s) for `Intl` formatting.
     * @defaultValue the components context's `locale()`
     */
    locales?: string | readonly string[] | undefined;
    /** Renders one item. */
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
