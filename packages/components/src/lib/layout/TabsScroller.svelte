<!--
  The scrolling half of panels-mode `Tabs`: the `tablist` as a horizontal
  scroller between left/right buttons that show only while it overflows.
  The buttons sit outside the `tablist` (only tabs may live in it) and out of
  the Tab order: the arrow keys reach every tab, and the focused or selected
  tab scrolls into view, so they are for pointers. They are physical, so
  under `dir="rtl"` the row reverses to keep each at the end it names.
-->
<script lang="ts">
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { Tabs as BitsTabs } from 'bits-ui';
  import { tick, type Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import type { TabItem } from './types.ts';

  interface Props {
    /** The tab triggers. */
    children: Snippet;
    /** Accessible name of the tab list. */
    label: string;
    /** Names the left scroll button. */
    scrollLeftLabel: string;
    /** Names the right scroll button. */
    scrollRightLabel: string;
    /** The selected value; a change scrolls its tab into view. */
    selected: string;
    /** The tabs; a change measures again. */
    items: readonly TabItem[];
    /** Classes on the tab list. */
    class: ClassValue;
  }

  let {
    children,
    label,
    scrollLeftLabel,
    scrollRightLabel,
    selected,
    items,
    class: className,
  }: Props = $props();

  let list: HTMLElement | null = $state(null);
  let overflowing = $state(false);
  let canScrollLeft = $state(false);
  let canScrollRight = $state(false);
  let rtl = $state(false);

  // Physical edges: under RTL `scrollLeft` runs from minus the range up to 0.
  function measure(): void {
    if (list === null) return;
    const range = list.scrollWidth - list.clientWidth;
    rtl = getComputedStyle(list).direction === 'rtl';
    const fromLeft = rtl ? list.scrollLeft + range : list.scrollLeft;
    overflowing = range > 1;
    canScrollLeft = fromLeft > 1;
    canScrollRight = fromLeft < range - 1;
  }

  function scrollTabs(direction: -1 | 1): void {
    if (list === null) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollBy({
      left: direction * list.clientWidth * 0.8,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }

  // Scrolls only the list, so a selection made off screen never moves the page.
  function revealSelected(): void {
    const tab = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (list === null || tab === null || tab === undefined) return;
    const bounds = list.getBoundingClientRect();
    const box = tab.getBoundingClientRect();
    if (box.left < bounds.left) list.scrollLeft -= bounds.left - box.left;
    else if (box.right > bounds.right) list.scrollLeft += box.right - bounds.right;
  }

  const revealFocused = (event: FocusEvent): void => {
    if (event.target instanceof HTMLElement && event.target !== list) {
      event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  $effect(() => {
    if (list === null) return;
    void items;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    for (const child of list.children) observer.observe(child);
    measure();
    return () => observer.disconnect();
  });

  async function settle(): Promise<void> {
    await tick();
    revealSelected();
    measure();
  }

  $effect(() => {
    if (list === null) return;
    void items;
    void selected;
    void settle();
  });
</script>

{#snippet scrollButton(direction: -1 | 1)}
  <IconButtonCore
    label={direction < 0 ? scrollLeftLabel : scrollRightLabel}
    size="sm"
    tabindex={-1}
    disabled={direction < 0 ? !canScrollLeft : !canScrollRight}
    style="flex-shrink: 0;"
    onclick={() => scrollTabs(direction)}
  >
    {#snippet icon()}
      {#if direction < 0}<ChevronLeft class="size-4" />{:else}<ChevronRight class="size-4" />{/if}
    {/snippet}
  </IconButtonCore>
{/snippet}

<div
  style:display="flex"
  style:align-items="center"
  style:flex-direction={rtl ? 'row-reverse' : 'row'}
>
  {#if overflowing}{@render scrollButton(-1)}{/if}
  <BitsTabs.List
    bind:ref={list}
    class={className}
    aria-label={label}
    style="display: flex; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; flex: 1 1 auto; min-width: 0;"
    onscroll={measure}
    onfocusin={revealFocused}
  >
    {@render children()}
  </BitsTabs.List>
  {#if overflowing}{@render scrollButton(1)}{/if}
</div>
