<!--
  ItemList — the list every index page and detail section renders, in the four
  shapes those pages actually use: a `compact` run of links, `stacked` rows
  divided by rules, a responsive `grid`, or a grid of `cards`.

  The row body is the caller's, through the `item` snippet, because row shape
  varies per resource type; what this owns is the container, the keying and
  the empty state — so an empty list cannot be forgotten in one page out of
  twenty.

  ARIA contract, two modes:

  - Default: a plain `<ul>` of `<li>`s. The list structure is the semantics —
    a screen reader announces "list, 12 items" — and nothing is added to it.
  - `feed`: the ARIA feed pattern, for a stream whose items load as the
    reader scrolls. The container takes `role="feed"`, an accessible name from
    `label`, and `aria-busy` while more is loading; each item is an `<article>`
    carrying `aria-posinset` / `aria-setsize`, so "article 7 of 40" is
    announced even though only 20 are in the DOM, and `tabindex="-1"` so the
    reader's Page Down lands somewhere.

    Feed mode renders `<div role="feed">` with `<article>` children rather
    than a list, deliberately: `feed` is not a role HTML permits on `<ul>`,
    and forcing `role="article"` onto each `<li>` would throw away the list
    semantics to get there. A feed is not a list, and the markup says so.
-->
<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type Variant = 'compact' | 'stacked' | 'grid' | 'cards';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    items: readonly T[];
    variant?: Variant | undefined;
    /** Stable identity per item — the `{#each}` key. */
    getKey: (item: T, index: number) => string;
    /** One row's body. */
    item: Snippet<[T, number]>;
    /** Rendered in place of the list when there is nothing in it. */
    empty?: Snippet<[]> | undefined;
    /** The line shown when there is nothing and no `empty` snippet. */
    emptyMessage?: string | undefined;
    /** Render as an ARIA feed. */
    feed?: boolean | undefined;
    /** The feed's accessible name. Required in `feed` mode to name the region. */
    label?: string | undefined;
    /** More items are loading — `aria-busy` on the feed. */
    busy?: boolean | undefined;
  }

  let {
    items,
    variant = 'compact',
    getKey,
    item,
    empty,
    emptyMessage = 'Nothing here yet.',
    feed = false,
    label,
    busy = false,
    class: className,
    ...rest
  }: Props = $props();

  // Literal lookup tables: Tailwind only generates the classes it can read
  // verbatim in the source, so these can never become template strings.
  const containerClass: Record<Variant, string> = {
    compact: 'space-y-1',
    stacked: 'divide-base-300 divide-y',
    grid: 'grid grid-cols-1 gap-3 sm:grid-cols-2',
    cards: 'grid grid-cols-1 gap-4 sm:grid-cols-2',
  };

  const itemClass: Record<Variant, string> = {
    compact: '',
    stacked: 'py-3',
    grid: '',
    cards: 'card card-border bg-base-100 p-4 shadow-sm',
  };

  const setSize = $derived(items.length);
</script>

{#if items.length === 0}
  {#if empty}
    {@render empty()}
  {:else}
    <p class="text-base-content/70 text-sm leading-6">{emptyMessage}</p>
  {/if}
{:else if feed}
  <div
    {...rest}
    role="feed"
    aria-label={label}
    aria-busy={busy}
    class={[containerClass[variant], className]}
  >
    {#each items as entry, index (getKey(entry, index))}
      <article
        aria-posinset={index + 1}
        aria-setsize={setSize}
        tabindex="-1"
        class={itemClass[variant]}
      >
        {@render item(entry, index)}
      </article>
    {/each}
  </div>
{:else}
  <ul {...rest} aria-label={label} class={[containerClass[variant], className]}>
    {#each items as entry, index (getKey(entry, index))}
      <li class={itemClass[variant]}>{@render item(entry, index)}</li>
    {/each}
  </ul>
{/if}
