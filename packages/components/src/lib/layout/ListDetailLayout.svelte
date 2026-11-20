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
  - `resizable`: from `expandAt` up, the divider is `Splitter`'s handle
    (`SplitterHandle`, the APG window splitter): a focusable `separator`
    named by `handleLabel` that controls the list region, moved by the arrow
    keys, Home / End or a drag. `listSize` is the list's width in percent
    of the layout, bindable; until it is set the list keeps its `listWidth`
    token, and the handle reports the share that token measures to. On
    compact widths the handle is `display: none` with the hidden pane.
-->
<script lang="ts">
  import { ChevronLeft } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import LinkButton from '../ui/LinkButton.svelte';
  import SplitterHandle from './SplitterHandle.svelte';
  import {
    compactOnly,
    expandQuery,
    handleFromBreakpoint,
    listDetailGrid,
    listDetailGridResizable,
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
    /**
     * Make the divider a draggable, keyboard-operable handle (from `expandAt` up).
     * @defaultValue `false`
     */
    resizable?: boolean | undefined;
    /** `resizable`: the list's width in percent of the layout; `undefined` keeps `listWidth`. Bindable. */
    listSize?: number | undefined;
    /**
     * `resizable`: the narrowest the list goes, in percent.
     * @defaultValue `15`
     */
    minListSize?: number | undefined;
    /**
     * `resizable`: the widest the list goes, in percent.
     * @defaultValue `60`
     */
    maxListSize?: number | undefined;
    /**
     * `resizable`: the handle's accessible name.
     * @defaultValue `'Resize list'`
     */
    handleLabel?: string | undefined;
    /** `resizable`: called with the settled `listSize` after each key press or drag that changed it. */
    onListResize?: ((size: number) => void) | undefined;
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
    resizable = false,
    listSize = $bindable(undefined),
    minListSize = 15,
    maxListSize = 60,
    handleLabel = 'Resize list',
    onListResize,
    class: className,
    style,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const listId = `${uid}-list`;
  let layout: HTMLDivElement | undefined = $state();
  let listPane: HTMLElement | undefined = $state();
  let detailPane: HTMLElement | undefined = $state();
  /** The share of the layout the `listWidth` token comes to, for the handle before `listSize` is set. */
  let measured = $state(30);

  $effect(() => {
    if (!resizable || listSize !== undefined || layout === undefined || listPane === undefined) return;
    const box = layout;
    const pane = listPane;
    const measure = (): void => {
      if (box.clientWidth > 0) measured = (pane.offsetWidth / box.clientWidth) * 100;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  });

  const listWidthValue = $derived(
    resizable && listSize !== undefined ? `${listSize}%` : listWidths[listWidth],
  );
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
  bind:this={layout}
  style={[`--list-width: ${listWidthValue}`, style].filter(Boolean).join('; ')}
  class={[
    'flex min-h-0 flex-col',
    resizable ? listDetailGridResizable[expandAt] : listDetailGrid[expandAt],
    className,
  ]}
>
  <section
    bind:this={listPane}
    id={listId}
    aria-label={listLabel}
    class={[
      'min-h-0 flex-col overflow-y-auto',
      showDetail ? paneFromBreakpoint[expandAt] : 'flex',
      !resizable && listDivider[expandAt],
    ]}
  >
    {@render list()}
  </section>
  {#if resizable}
    <SplitterHandle
      bind:value={() => listSize ?? measured, (next) => (listSize = next)}
      min={minListSize}
      max={maxListSize}
      step={5}
      collapsible={false}
      orientation="horizontal"
      label={handleLabel}
      controls={listId}
      container={() => layout}
      onCommit={onListResize}
      class={['w-1', handleFromBreakpoint[expandAt]]}
    />
  {/if}
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
