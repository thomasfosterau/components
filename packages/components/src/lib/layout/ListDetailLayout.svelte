<!-- @component
An adaptive list / detail layout: both panes side by side on wide screens, one at a time — chosen by the route — on compact ones.
-->
<!--
  ListDetailLayout — a list (beds, messages, records) and the selected
  item's detail. From `expandAt` up, both panes sit side by side, each with
  its own scroll. Below it, one pane shows at a time: the list, or the detail
  with a Back link. `showDetail` (true when the route has a selected id)
  decides which, so the compact state is right from the server, works
  without JavaScript, and follows the browser's Back button. Routing stays
  in the app; the Back link resolves through the components context.

  `DetailLayout` is a different thing: one detail PAGE with a summary
  column, no list.

  ARIA contract:
  - Each pane is a labelled region (`<section aria-label>`); neither is
    `<main>` — the app's `Main` wraps the whole layout.
  - On compact widths the hidden pane is `display: none`, so it is out of the
    accessibility tree and the tab order.
  - When the compact state flips to the detail (a client-side navigation),
    focus moves to the detail region (`tabindex="-1"`, as SvelteKit's route
    focus does); on the way back, to the element whose id is `focusTarget`
    (the list item that was opened). From `expandAt` up nothing moves focus:
    both panes are there. Which width applies is read with `matchMedia` on
    the client only, for that decision — the layout itself is CSS.
  - The selected list item's `aria-current="true"` is the app's to set.
-->
<script lang="ts">
  import { ChevronLeft } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import LinkButton from '../ui/LinkButton.svelte';
  import {
    compactOnly,
    expandQuery,
    listDetailGrid,
    listDivider,
    listWidth as listWidths,
    paneFromBreakpoint,
    type ExpandAt,
  } from './types.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'placeholder'> {
    /** The list pane. */
    list: Snippet<[]>;
    /** The detail pane. */
    detail: Snippet<[]>;
    /** Shown in the detail pane on wide screens while nothing is selected. */
    placeholder?: Snippet<[]> | undefined;
    /** Whether an item is selected (the route has an id); on compact widths, shows the detail. */
    showDetail: boolean;
    /** Where Back goes on compact widths — usually the list route. */
    backHref: string;
    /**
     * Text of the compact Back link.
     * @defaultValue `'Back'`
     */
    backLabel?: string | undefined;
    /**
     * Accessible name of the list region.
     * @defaultValue `'List'`
     */
    listLabel?: string | undefined;
    /**
     * Accessible name of the detail region.
     * @defaultValue `'Details'`
     */
    detailLabel?: string | undefined;
    /**
     * The width class from which the panes sit side by side.
     * @defaultValue `'lg'`
     */
    expandAt?: ExpandAt | undefined;
    /**
     * The list pane's width: `sm` 20rem, `md` 24rem, `lg` 28rem.
     * @defaultValue `'md'`
     */
    listWidth?: 'sm' | 'md' | 'lg' | undefined;
    /** The id of the element to focus when compact navigation returns to the list. */
    focusTarget?: string | undefined;
  }

  let {
    list,
    detail,
    placeholder,
    showDetail,
    backHref,
    backLabel = 'Back',
    listLabel = 'List',
    detailLabel = 'Details',
    expandAt = 'lg',
    listWidth = 'md',
    focusTarget,
    class: className,
    style,
    ...rest
  }: Props = $props();

  let detailPane: HTMLElement | undefined = $state();
  /** The `showDetail` last seen, so only a change (not the first render) moves focus. */
  let previous: boolean | undefined;

  $effect(() => {
    const now = showDetail;
    const before = previous;
    previous = now;
    if (before === undefined || before === now) return;
    if (globalThis.matchMedia?.(expandQuery[expandAt]).matches === true) return;
    if (now) {
      detailPane?.focus();
    } else if (focusTarget !== undefined) {
      document.getElementById(focusTarget)?.focus();
    }
  });
</script>

<div
  {...rest}
  style={[`--list-width: ${listWidths[listWidth]}`, style].filter(Boolean).join('; ')}
  class={['flex min-h-0 flex-col', listDetailGrid[expandAt], className]}
>
  <section
    aria-label={listLabel}
    class={[
      'min-h-0 flex-col overflow-y-auto',
      showDetail ? paneFromBreakpoint[expandAt] : 'flex',
      listDivider[expandAt],
    ]}
  >
    {@render list()}
  </section>
  <section
    bind:this={detailPane}
    aria-label={detailLabel}
    tabindex="-1"
    class={[
      'min-h-0 flex-col overflow-y-auto focus:outline-none',
      showDetail ? 'flex' : paneFromBreakpoint[expandAt],
    ]}
  >
    {#if showDetail}
      <div class={['p-2', compactOnly[expandAt]]}>
        <LinkButton href={backHref} variant="ghost" size="sm">
          {#snippet icon()}<ChevronLeft class="size-4 rtl:rotate-180" aria-hidden="true" />{/snippet}
          {backLabel}
        </LinkButton>
      </div>
      {@render detail()}
    {:else if placeholder}
      {@render placeholder()}
    {/if}
  </section>
</div>
