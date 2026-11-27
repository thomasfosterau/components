<!-- @component
A row that shows as many items as fit and moves the rest, lowest priority first, into a trailing "More" menu.
-->
<!--
  Priority+ overflow. One `ResizeObserver` on the row re-runs the fit
  (`overflow.ts`); item widths are cached while visible, so a hidden item
  keeps its last width, and are measured again once web fonts load. A
  hidden item is `display: none`, so it is out of the accessibility tree and
  appears exactly once: in the menu, as a `MenuItem` (a link keeps
  `aria-current`). A `pinned` or `current` item never moves.

  The menu is `DropdownMenu` (an APG menu button), loaded with a dynamic
  `import()` the first time anything overflows, so a row that always fits
  never loads bits-ui's menu runtime. Until the first measure the
  row wraps, so a reader without script sees every item; `data-overflow-ready`
  marks the measured row for callers who want to hide the first frame.

  In a `ul` or `ol` each item is wrapped in an `<li>`. In a `div` nothing
  wraps it, so styles like `.tabs > .tab` still reach it: the `item` snippet
  spreads the attributes it is given onto its root element.
  The trigger is the last item in DOM and visual order for `end`; for
  `start` and `middle` it sits where the hidden items were. A `trigger`
  snippet replaces the trigger's element (a toolbar's must be a toolbar
  control); it spreads the `props` it is given.
-->
<script lang="ts" module>
  /** One item of an `Overflow` row. */
  export interface OverflowEntry {
    /** Stable key. */
    readonly id: string;
    /** What the menu shows when the item is hidden. */
    readonly label: string;
    /**
     * Higher stays visible longer; ties break by position.
     * @defaultValue `0`
     */
    readonly priority?: number | undefined;
    /** Never moves into the menu. */
    readonly pinned?: boolean | undefined;
    /** The menu entry links here. */
    readonly href?: string | undefined;
    /** The menu entry calls this. */
    readonly onSelect?: (() => void) | undefined;
    /** The current page: pinned, and `aria-current` in the menu. */
    readonly current?: boolean | undefined;
    /** The menu entry is disabled. */
    readonly disabled?: boolean | undefined;
  }

  /** What a `div` row's `item` spreads onto its root element. */
  export interface OverflowItemAttributes {
    readonly 'data-overflow-id'?: string;
    /** Present while the item is in the menu. */
    readonly 'data-overflow-hidden'?: '';
    readonly style?: string;
  }

  /** What a `trigger` snippet is given: `props` to spread onto its button, and the text to show. */
  export interface OverflowTrigger {
    readonly props: Record<string, unknown>;
    readonly text: string;
  }
</script>

<script lang="ts" generics="T extends OverflowEntry">
  import { tick, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import MenuItem from './MenuItem.svelte';
  import { hiddenIndexes, triggerSlot, type CollapseFrom } from './overflow.ts';

  type DropdownMenuComponent = typeof import('./DropdownMenu.svelte').default;

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /** The items, in order. */
    items: readonly T[];
    /** Render one item. In a `div` row, spread the third argument onto its root element: it carries the measuring hook and hides the item when it overflows. */
    item: Snippet<[T, number, OverflowItemAttributes]>;
    /** Render one hidden item inside the menu. Omitted, a `MenuItem` with its `label`, `href`, `onSelect`, `current` and `disabled`. */
    menuItem?: Snippet<[T, number]> | undefined;
    /**
     * The row's element; in a list each item is an `<li>`.
     * @defaultValue `'div'`
     */
    element?: 'div' | 'ul' | 'ol' | undefined;
    /**
     * Which end collapses first; `middle` keeps the first and last items.
     * @defaultValue `'end'`
     */
    collapseFrom?: CollapseFrom | undefined;
    /**
     * Never show fewer items than this.
     * @defaultValue `1`
     */
    minVisible?: number | undefined;
    /**
     * Names the "More" trigger and its menu.
     * @defaultValue `'More'`
     */
    moreLabel?: string | undefined;
    /** Visible text of the trigger when it differs from `moreLabel`, e.g. `'…'`; `moreLabel` stays its name. */
    moreText?: string | undefined;
    /**
     * Add the hidden count to the trigger: "More (3)".
     * @defaultValue `false`
     */
    showCount?: boolean | undefined;
    /**
     * Classes on the trigger button.
     * @defaultValue `'btn btn-ghost btn-sm'`
     */
    triggerClass?: string | undefined;
    /** Render the "More" trigger yourself, spreading `props` onto a button. Omitted, a plain `<button>`. */
    trigger?: Snippet<[OverflowTrigger]> | undefined;
    /** Called with the hidden items whenever they change. */
    onHiddenChange?: ((hidden: readonly T[]) => void) | undefined;
  }

  let {
    items,
    item,
    menuItem,
    element = 'div',
    collapseFrom = 'end',
    minVisible = 1,
    moreLabel = 'More',
    moreText,
    showCount = false,
    triggerClass = 'btn btn-ghost btn-sm',
    trigger: customTrigger,
    onHiddenChange,
    class: className,
    ...rest
  }: Props = $props();

  const itemTag = $derived(element === 'div' ? 'div' : 'li');

  function attributesFor(entry: T, index: number): OverflowItemAttributes {
    return hidden.has(index)
      ? { 'data-overflow-id': entry.id, 'data-overflow-hidden': '', style: 'flex-shrink: 0; display: none;' }
      : { 'data-overflow-id': entry.id, style: 'flex-shrink: 0;' };
  }

  let row: HTMLElement | undefined = $state();
  let measurer: HTMLElement | undefined = $state();
  let hidden: ReadonlySet<number> = $state(new Set());
  let ready = $state(false);
  let Menu: DropdownMenuComponent | undefined = $state();
  const widths = new Map<string, number>();

  const slot = $derived(triggerSlot(hidden, items.length, collapseFrom));
  const hiddenEntries = $derived(
    items.map((entry, index) => ({ entry, index })).filter(({ index }) => hidden.has(index)),
  );
  const triggerText = $derived(
    `${moreText ?? moreLabel}${showCount ? ` (${hiddenEntries.length})` : ''}`,
  );

  function fit(): void {
    if (row === undefined) return;
    for (const wrapper of row.querySelectorAll<HTMLElement>(':scope > [data-overflow-id]')) {
      const id = wrapper.dataset['overflowId'];
      if (id !== undefined && wrapper.style.display !== 'none') widths.set(id, wrapper.getBoundingClientRect().width);
    }
    const style = getComputedStyle(row);
    const padding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
    hidden = hiddenIndexes(
      items.map((entry) => ({
        width: widths.get(entry.id) ?? 0,
        priority: entry.priority ?? 0,
        pinned: entry.pinned === true || entry.current === true,
      })),
      {
        available: row.clientWidth - (Number.isNaN(padding) ? 0 : padding),
        moreWidth: measurer?.getBoundingClientRect().width ?? 0,
        gap: Number.parseFloat(style.columnGap) || 0,
        collapseFrom,
        minVisible,
      },
    );
    ready = true;
  }

  $effect(() => {
    if (row === undefined) return;
    const observer = new ResizeObserver(() => fit());
    observer.observe(row);
    let live = true;
    const refit = async (): Promise<void> => {
      await document.fonts?.ready;
      if (!live) return;
      widths.clear();
      hidden = new Set();
      await tick();
      fit();
    };
    void refit();
    return () => {
      live = false;
      observer.disconnect();
    };
  });

  // New items: measure them once they are in the DOM.
  $effect(() => {
    void items;
    void tick().then(fit);
  });

  // `MenuItem` imports nothing from bits-ui; the menu runtime is `DropdownMenu`'s.
  async function loadMenu(): Promise<void> {
    Menu = (await import('./DropdownMenu.svelte')).default;
  }

  $effect(() => {
    if (hidden.size > 0 && Menu === undefined) void loadMenu();
  });

  $effect(() => {
    onHiddenChange?.(hiddenEntries.map(({ entry }) => entry));
  });
</script>

{#snippet menu(Dropdown: DropdownMenuComponent)}
  <Dropdown label={moreLabel}>
    {#snippet trigger({ props })}
      {@const triggerProps = {
        ...props,
        type: 'button' as const,
        class: triggerClass,
        style: 'flex-shrink: 0;',
        'data-overflow-more': '',
        'aria-label': moreText === undefined ? undefined : moreLabel,
      }}
      {#if customTrigger}
        {@render customTrigger({ props: triggerProps, text: triggerText })}
      {:else}
        <button {...triggerProps}>{triggerText}</button>
      {/if}
    {/snippet}
    {#each hiddenEntries as { entry, index } (entry.id)}
      {#if menuItem}
        {@render menuItem(entry, index)}
      {:else}
        <MenuItem href={entry.href} onSelect={entry.onSelect} current={entry.current} disabled={entry.disabled}>
          {entry.label}
        </MenuItem>
      {/if}
    {/each}
  </Dropdown>
{/snippet}

{#snippet more()}
  {#if hiddenEntries.length > 0 && Menu !== undefined}
    {#if element === 'div'}
      {@render menu(Menu)}
    {:else}
      <li style="flex-shrink: 0;">{@render menu(Menu)}</li>
    {/if}
  {/if}
{/snippet}

<svelte:element
  this={element}
  bind:this={row}
  {...rest}
  class={['items-center', className]}
  style:display="flex"
  style:position="relative"
  style:flex-wrap={ready ? 'nowrap' : 'wrap'}
  style:min-width="0"
  data-overflow-ready={ready ? '' : undefined}
>
  {#each items as entry, index (entry.id)}
    {#if index === slot}{@render more()}{/if}
    {#if element === 'div'}
      {@render item(entry, index, attributesFor(entry, index))}
    {:else}
      <li {...attributesFor(entry, index)}>{@render item(entry, index, {})}</li>
    {/if}
  {/each}
  {#if slot === items.length}{@render more()}{/if}
  <svelte:element
    this={itemTag}
    bind:this={measurer}
    data-overflow-measurer
    aria-hidden="true"
    inert
    style="position: absolute; visibility: hidden; pointer-events: none;"
  >
    <span class={triggerClass}>{triggerText}</span>
  </svelte:element>
</svelte:element>
