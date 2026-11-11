<!-- @component
A list of thousands of rows that mounts only the rows in or near the viewport, with every row's position in the whole stated for assistive technology.
-->
<!--
  VirtualList — windowing for a list too long to render whole (an
  observation log, a species catalogue, a CSV preview): only the rows in the
  viewport plus `overscan` either side are in the DOM, and two `aria-hidden`
  spacers stand in for the rest so the scrollbar is the whole list's.

  Dependency decision: hand-rolled. `@tanstack/svelte-virtual` was the
  alternative, but it would be a third-party runtime dependency of the core,
  and AGENTS.md sends a component that needs one into its own package. The
  windowing core is small and well understood — a prefix sum of row sizes and
  a binary search over it — so it lives in `virtual.svelte.ts` and is tested
  there. bits-ui has no virtualised list primitive, so nothing here is
  hand-rolled that a primitive could have owned.

  For a few hundred rows prefer `ItemList` with `lazyRender`
  (`content-visibility: auto`): every row stays in the DOM, so find-in-page
  and a screen reader's browse mode still reach all of them.

  Layout: rows are in normal flow between spacers, never absolutely
  positioned, so DOM order is reading order. Fixed rows (`measure` off) are
  given `estimateSize` as their height; measured rows are observed with a
  ResizeObserver (border box — give rows padding, not vertical margin).

  ARIA contract:

  - Every rendered row carries `aria-posinset` (1-based, absolute) and
    `aria-setsize` (`total ?? items.length`), so "4,312 of 10,000" is
    announced with thirty rows in the DOM.
  - `semantics="list"`: `role="list"` (named by `label`, if given) of
    `role="listitem"` rows. Explicit roles, because `aria-posinset` /
    `aria-setsize` are valid on `listitem` and a `<ul>` with spacer `<div>`s
    in it would not be a valid list.
  - `semantics="feed"`: `ItemList`'s feed contract exactly — `role="feed"`
    named by `label`, `aria-busy`, `<article tabindex="-1">` rows — and the
    APG Feed keys: Page Down / Page Up move focus to the next / previous
    article, scrolling it into existence first if it is outside the window,
    and Ctrl+End / Ctrl+Home leave the feed for the next / previous
    focusable element outside it, found from the feed's own place in the
    document so unrendered rows never matter (`feed.ts`, shared with
    `ItemList`).
  - `aria-busy` reflects `busy` in both modes.
  - Spacers are `aria-hidden` and carry no role.
  - Focus retention: the row holding focus stays mounted however far the
    reader scrolls, until focus leaves it, so focus never falls to `<body>`.
  - Rows are `tabindex="-1"` in both modes: programmatically focusable (for
    `scrollToIndex(…, { focus: true })` and the feed keys), never in the tab
    order — the controls inside a row are.
  - `scrollToIndex` moves focus only when asked (`{ focus: true }`).
  - Find-in-page and browse mode cannot reach unrendered rows; that is the
    trade-off of virtualising, stated in the README.
-->
<script lang="ts" generics="T">
  import { tick, untrack, type Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLAttributes } from 'svelte/elements';
  import { feedStep, leaveFeed } from './feed.ts';
  import {
    VirtualWindow,
    type VirtualAlign,
    type VirtualKey,
    type VirtualListApi,
    type VirtualScrollOptions,
  } from './virtual.svelte.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The whole list; only a window of it is rendered. */
    items: readonly T[];
    /** Stable, unique identity per item — what keeps focus and measurements across scrolling. */
    key: (item: T, index: number) => VirtualKey;
    /** One row's body. */
    row: Snippet<[T, { index: number }]>;
    /**
     * Each row's height in px, or the estimate for a row not yet measured.
     * @defaultValue `48`
     */
    estimateSize?: number | undefined;
    /**
     * Measure each rendered row instead of fixing its height.
     * @defaultValue `false`
     */
    measure?: boolean | undefined;
    /**
     * Rows rendered beyond each edge of the viewport.
     * @defaultValue `6`
     */
    overscan?: number | undefined;
    /**
     * What scrolls: this element (give it a height through `class`) or the window.
     * @defaultValue `'element'`
     */
    scroller?: 'element' | 'window' | undefined;
    /** The whole collection's size when larger than `items` (more pages exist), for `aria-setsize`. */
    total?: number | undefined;
    /**
     * Called once each time the last row comes into the rendered window — not
     * while `busy`, and not once `items` holds `total` rows.
     */
    onEndReached?: (() => void) | undefined;
    /**
     * A fetch for more rows is in flight — `aria-busy`.
     * @defaultValue `false`
     */
    busy?: boolean | undefined;
    /**
     * The semantics: a `list` of `listitem`s, or `ItemList`'s ARIA `feed`.
     * @defaultValue `'list'`
     */
    semantics?: 'list' | 'feed' | undefined;
    /** The list's accessible name. Required for `feed`. */
    label?: string | undefined;
    /** Bindable handle: `scrollToIndex(index, { align, focus })`, `scrollToKey(key, options)`. */
    api?: VirtualListApi | undefined;
  }

  let {
    items,
    key: keyOf,
    row,
    estimateSize = 48,
    measure = false,
    overscan = 6,
    scroller = 'element',
    total,
    onEndReached,
    busy = false,
    semantics = 'list',
    label,
    api = $bindable(),
    class: className,
    ...rest
  }: Props = $props();

  type Part =
    | { readonly kind: 'row'; readonly id: string; readonly item: T; readonly index: number }
    | { readonly kind: 'spacer'; readonly id: string; readonly size: number };

  let viewport: HTMLDivElement | undefined = $state();
  let list: HTMLDivElement | undefined = $state();
  /** The key of the row holding focus, kept rendered until focus leaves it. */
  let pinnedKey = $state<VirtualKey | undefined>();

  const keys = $derived(items.map((item, index) => keyOf(item, index)));
  const indexByKey = $derived(new Map(keys.map((rowKey, index) => [rowKey, index])));
  const setSize = $derived(total ?? items.length);
  // A feed's rows are articles; a list's are explicit listitems.
  const rowTag = $derived(semantics === 'feed' ? 'article' : 'div');
  const rowRole = $derived(semantics === 'feed' ? undefined : 'listitem');
  const rowHeight = $derived(measure ? undefined : `${estimateSize}px`);

  const view = new VirtualWindow({
    count: () => items.length,
    keyAt: (index) => keys[index] ?? index,
    estimateSize: () => estimateSize,
    overscan: () => overscan,
    measure: () => measure,
  });

  /** The window, any pinned row outside it, and spacers for every gap, in index order. */
  const parts = $derived.by((): readonly Part[] => {
    const { start, end } = view.range;
    const pinned = pinnedKey === undefined ? undefined : indexByKey.get(pinnedKey);
    const out: Part[] = [];
    let cursor = 0;
    const take = (from: number, to: number): void => {
      if (from > cursor) {
        out.push({ kind: 'spacer', id: `s${out.length}`, size: view.offsetOf(from) - view.offsetOf(cursor) });
      }
      for (const [offset, item] of items.slice(from, to).entries()) {
        const index = from + offset;
        out.push({ kind: 'row', id: `r${String(keys[index])}`, item, index });
      }
      cursor = Math.max(cursor, to);
    };
    if (pinned !== undefined && pinned < start) take(pinned, pinned + 1);
    take(start, end);
    if (pinned !== undefined && pinned >= end) take(pinned, pinned + 1);
    if (cursor < items.length) {
      out.push({ kind: 'spacer', id: `s${out.length}`, size: view.totalSize - view.offsetOf(cursor) });
    }
    return out;
  });

  /** Read the viewport's position relative to the list into the window. */
  function update(): void {
    if (list === undefined) return;
    const listTop = list.getBoundingClientRect().top;
    if (scroller === 'window') {
      view.viewportSize = window.innerHeight;
      view.scrollOffset = -listTop;
    } else if (viewport !== undefined) {
      view.viewportSize = viewport.clientHeight;
      view.scrollOffset = viewport.getBoundingClientRect().top + viewport.clientTop - listTop;
    }
  }

  $effect(() => {
    const target = scroller === 'window' ? window : viewport;
    if (target === undefined || list === undefined) return;
    update();
    const onChange = (): void => update();
    target.addEventListener('scroll', onChange, { passive: true });
    window.addEventListener('resize', onChange);
    const resize = new ResizeObserver(onChange);
    if (viewport !== undefined) resize.observe(viewport);
    return () => {
      target.removeEventListener('scroll', onChange);
      window.removeEventListener('resize', onChange);
      resize.disconnect();
    };
  });

  // One observer for every measured row; each row's key rides on its node.
  let sizeObserver: ResizeObserver | undefined;
  const observedKeys = new WeakMap<Element, VirtualKey>();

  function measured(rowKey: VirtualKey): Attachment<HTMLElement> {
    return (node) => {
      sizeObserver ??= new ResizeObserver((entries) => {
        const sizes = entries.map((entry) => ({
          key: observedKeys.get(entry.target),
          size: entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height,
        }));
        // Applied next frame: re-laying out inside the observer's own
        // callback is the "ResizeObserver loop" error error monitors report.
        requestAnimationFrame(() => {
          for (const { key: observedKey, size } of sizes) {
            if (observedKey !== undefined) view.setSize(observedKey, size);
          }
        });
      });
      observedKeys.set(node, rowKey);
      sizeObserver.observe(node);
      return () => sizeObserver?.unobserve(node);
    };
  }

  $effect(() => () => sizeObserver?.disconnect());

  // `onEndReached`: armed again whenever the window leaves the end or the
  // list grows, so it fires once per approach rather than per scroll event.
  let endArmed = true;
  let endCount = 0;
  $effect(() => {
    const count = items.length;
    const nearEnd = view.viewportSize > 0 && count > 0 && view.range.end >= count;
    if (count !== endCount) {
      endCount = count;
      endArmed = true;
    }
    if (!nearEnd) {
      endArmed = true;
      return;
    }
    const exhausted = total !== undefined && count >= total;
    if (!endArmed || busy || exhausted) return;
    endArmed = false;
    untrack(() => onEndReached?.());
  });

  function rowElement(index: number): HTMLElement | undefined {
    const found = list?.querySelector(`:scope > [data-index="${index}"]`);
    return found instanceof HTMLElement ? found : undefined;
  }

  function rowIndexOf(target: EventTarget | null): number | undefined {
    if (!(target instanceof Element) || list === undefined) return undefined;
    const found = target.closest('[data-index]');
    if (!(found instanceof HTMLElement) || found.parentElement !== list) return undefined;
    return Number(found.dataset['index']);
  }

  function scrollBy(delta: number): void {
    if (scroller === 'window') window.scrollBy({ top: delta, behavior: 'instant' });
    else viewport?.scrollBy({ top: delta, behavior: 'instant' });
  }

  const frame = (): Promise<void> =>
    new Promise((resolve) => requestAnimationFrame(() => resolve()));

  /**
   * Scroll row `target` to `align`. Measured rows can land off their
   * estimate, so re-align once the newly rendered rows have reported their
   * real sizes, until the row stays put (or `attempts` run out).
   */
  async function settle(target: number, align: VirtualAlign, attempts: number): Promise<void> {
    update();
    const delta = view.alignedOffset(target, align) - view.scrollOffset;
    if (Math.abs(delta) < 1) return;
    scrollBy(delta);
    update();
    await tick();
    if (!measure || attempts <= 1) return;
    // One frame for the observer to see the new rows, one for its sizes to land.
    await frame();
    await frame();
    await settle(target, align, attempts - 1);
  }

  async function scrollToIndex(index: number, options?: VirtualScrollOptions): Promise<void> {
    if (items.length === 0) return;
    const target = Math.min(Math.max(Math.trunc(index), 0), items.length - 1);
    await settle(target, options?.align ?? 'auto', 6);
    await tick();
    if (options?.focus === true) rowElement(target)?.focus({ preventScroll: true });
  }

  async function scrollToKey(rowKey: VirtualKey, options?: VirtualScrollOptions): Promise<void> {
    const index = indexByKey.get(rowKey);
    if (index !== undefined) await scrollToIndex(index, options);
  }

  api = { scrollToIndex, scrollToKey };

  /** Pin whichever row now holds focus, or none. */
  function syncPin(): void {
    const index = rowIndexOf(document.activeElement);
    pinnedKey = index === undefined ? undefined : keys[index];
  }

  function onfocusout(): void {
    // Focus is mid-move during `focusout`; read where it landed afterwards.
    // A window blur leaves `activeElement` on the row, so the pin holds.
    queueMicrotask(syncPin);
  }

  function onkeydown(event: KeyboardEvent): void {
    if (semantics !== 'feed') return;
    if (list !== undefined && leaveFeed(event, list)) return;
    const step = feedStep(event);
    const index = rowIndexOf(event.target);
    if (step === undefined || index === undefined) return;
    const next = index + step;
    if (next < 0 || next >= items.length) return;
    event.preventDefault();
    void scrollToIndex(next, { align: 'auto', focus: true });
  }
</script>

<div {...rest} bind:this={viewport} class={[scroller === 'element' && 'overflow-y-auto', className]}>
  <div
    bind:this={list}
    role={semantics}
    aria-label={label}
    aria-busy={busy}
    onfocusin={syncPin}
    {onfocusout}
    {onkeydown}
  >
    {#each parts as part (part.id)}
      {#if part.kind === 'spacer'}
        <div aria-hidden="true" style:height="{part.size}px"></div>
      {:else}
        <svelte:element
          this={rowTag}
          role={rowRole}
          data-index={part.index}
          aria-posinset={part.index + 1}
          aria-setsize={setSize}
          tabindex="-1"
          style:height={rowHeight}
          style:box-sizing="border-box"
          {@attach measure ? measured(keys[part.index] ?? part.index) : undefined}
        >
          {@render row(part.item, { index: part.index })}
        </svelte:element>
      {/if}
    {/each}
  </div>
</div>
