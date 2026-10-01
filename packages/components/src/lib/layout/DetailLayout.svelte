<!-- @component
The two-column detail-page shell: a header across the top, a body column and a summary aside.
-->
<!--
  DetailLayout — the two-column detail-page shell: a header across the top, a
  body column, and a summary aside beside it.

  The reflow is the whole point. On a wide viewport the aside sits to the
  RIGHT of the body (a third of the width, the Wikipedia infobox position); on
  a phone there is no beside, and the useful order is title → aside → body,
  because the aside is the facts-at-a-glance block and a reader who has to
  scroll past the whole article to reach it will never reach it. That is done
  by putting the aside BEFORE the body in the column flow (`order-first`) and
  overriding to explicit grid placement from `lg` — not by rendering it twice,
  which would duplicate every id and every heading in the accessibility tree.

  ARIA contract: the aside is an `<aside aria-label>` — a `complementary`
  landmark, which is exactly what it is: content related to the page's main
  content and meaningful on its own. It is named because a landmark a reader
  cannot tell apart from another landmark is a landmark they will not use.
  `header` is a snippet rather than a set of title/subtitle props: it takes a
  `PageHeader`, which already owns the heading contract.

  This renders no `<main>`. It is placed INSIDE `Main` by the page, because a
  page that is two columns of a wider shell must not open a second landmark.
  `data-testid="detail-body"` / `"detail-infobox"` are carried over from
  website's original so its route tests keep working after adoption.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The page header block — normally a `PageHeader`. */
    header: Snippet<[]>;
    /** The main body column. */
    body: Snippet<[]>;
    /** The summary column — an infobox, a fact list, a map. */
    aside?: Snippet<[]> | undefined;
    /**
     * Accessible name of the `<aside>` landmark.
     * @defaultValue `'Summary'`
     */
    asideLabel?: string | undefined;
  }

  let {
    header,
    body,
    aside,
    asideLabel = 'Summary',
    class: className,
    ...rest
  }: Props = $props();
</script>

<div {...rest} class={['space-y-8', className]}>
  {@render header()}

  <div class="flex flex-col gap-8 lg:grid lg:grid-cols-3 lg:items-start">
    <div data-testid="detail-body" class="min-w-0 space-y-8 lg:col-span-2 lg:col-start-1 lg:row-start-1">
      {@render body()}
    </div>

    {#if aside}
      <aside
        data-testid="detail-infobox"
        aria-label={asideLabel}
        class="order-first min-w-0 lg:order-none lg:col-start-3 lg:row-start-1"
      >
        {@render aside()}
      </aside>
    {/if}
  </div>
</div>
