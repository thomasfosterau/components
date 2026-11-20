<!-- @component
"On this page": in-page links to a page's sections, nested by heading level, with the section being read marked (scroll-spy).
-->
<!--
  TableOfContents — from `entries`, or collected from the `h2`–`h6` with ids
  inside `container` (`Heading` gives them stable ids).

  ARIA contract: a `<nav>` named by `label`, holding an `<ol>` per level.
  Links are plain `#id` hrefs, so they work without scripts and in a new tab.
  With scripts, a click scrolls (smoothly, unless the reader prefers reduced
  motion), MOVES FOCUS to the heading so a keyboard or screen reader user's
  position follows the jump, and replaces the URL hash without adding a
  history entry. The section in view is `aria-current="location"`, drawn as a
  start border and a heavier weight, never colour alone, and never announced:
  a live region would chatter on every scroll. The spy is an
  `IntersectionObserver`, not a `scroll` listener. Below `collapseBelow` the
  list folds into a closed `Disclosure` titled `label`.
-->
<script module lang="ts">
  /** The width at which the list stops collapsing, per breakpoint. */
  const breakpoint = {
    md: '(min-width: 48rem)',
    lg: '(min-width: 64rem)',
    xl: '(min-width: 80rem)',
  } as const;

  const cssLength = (value: number | string): string =>
    typeof value === 'number' ? `${value}px` : value;

  const reducedMotion = (): boolean =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const defaultReplaceHash = (hash: string): void => {
    history.replaceState(history.state, '', hash);
  };
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { MediaQuery } from 'svelte/reactivity';
  import Disclosure from '../ui/Disclosure.svelte';
  import { focusElement } from './focus-target.ts';
  import {
    collectHeadings,
    nestEntries,
    type TocEntry,
    type TocLevel,
    type TocNode,
  } from './table-of-contents.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The sections; omit and pass `container` to collect its headings instead. */
    entries?: readonly TocEntry[] | undefined;
    /** The element, or a selector for it, whose headings to collect. */
    container?: HTMLElement | string | undefined;
    /**
     * Heading levels to collect.
     * @defaultValue `[2, 3]`
     */
    levels?: readonly TocLevel[] | undefined;
    /**
     * The landmark's name and visible heading.
     * @defaultValue `'On this page'`
     */
    label?: string | undefined;
    /**
     * Show `label` as a heading above the list.
     * @defaultValue `true`
     */
    showLabel?: boolean | undefined;
    /**
     * Mark the section in view.
     * @defaultValue `true`
     */
    scrollSpy?: boolean | undefined;
    /**
     * Height of a sticky header above the content, in pixels or a CSS length: targets scroll clear of it, and the spy ignores what it covers.
     * @defaultValue `0`
     */
    offset?: number | string | undefined;
    /**
     * Stick to the top of its column (below `offset`) as the page scrolls.
     * @defaultValue `false`
     */
    sticky?: boolean | undefined;
    /**
     * Fold into a disclosure below this breakpoint, or `false` never to.
     * @defaultValue `'lg'`
     */
    collapseBelow?: keyof typeof breakpoint | false | undefined;
    /** The active entry's id. Bindable. */
    active?: string | undefined;
    /**
     * Replace the URL's hash without a history entry. Defaults to `history.replaceState`; in SvelteKit pass `(hash) => replaceState(hash, page.state)` from `$app/navigation`.
     */
    replaceHash?: ((hash: string) => void) | undefined;
  }

  let {
    entries,
    container,
    levels = [2, 3],
    label = 'On this page',
    showLabel = true,
    scrollSpy = true,
    offset = 0,
    sticky = false,
    collapseBelow = 'lg',
    active = $bindable(),
    replaceHash = defaultReplaceHash,
    class: className,
    ...rest
  }: Props = $props();

  const labelId = $props.id();

  let collected: TocEntry[] = $state([]);
  const list = $derived(entries ?? collected);
  const tree = $derived(nestEntries(list));

  const wide = $derived(
    collapseBelow === false ? undefined : new MediaQuery(breakpoint[collapseBelow], true),
  );
  const collapsed = $derived(wide !== undefined && !wide.current);

  const resolveContainer = (): ParentNode | null => {
    if (container === undefined) return null;
    return typeof container === 'string' ? document.querySelector(container) : container;
  };

  $effect(() => {
    if (entries !== undefined) return;
    const root = resolveContainer();
    collected = root === null ? [] : collectHeadings(root, levels);
  });

  const targets = (): HTMLElement[] =>
    list.flatMap((entry) => {
      const element = document.getElementById(entry.id);
      return element === null ? [] : [element];
    });

  // Keep an anchored heading clear of a sticky header.
  $effect(() => {
    if (offset === 0) return;
    const length = cssLength(offset);
    const elements = targets();
    for (const element of elements) element.style.scrollMarginTop = length;
    return () => {
      for (const element of elements) element.style.removeProperty('scroll-margin-top');
    };
  });

  $effect(() => {
    if (!scrollSpy) return;
    const elements = targets();
    if (elements.length === 0) return;
    const top = cssLength(offset);
    const topPx = top.endsWith('px') || top.endsWith('%') ? top : '0px';
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          if (record.isIntersecting) visible.add(record.target.id);
          else visible.delete(record.target.id);
        }
        // The first heading in the reading band, in document order; with
        // none in it, the section being read is still the last one marked.
        const first = elements.find((element) => visible.has(element.id));
        if (first !== undefined) active = first.id;
      },
      { rootMargin: `-${topPx.replace(/^-/, '')} 0px -60% 0px` },
    );
    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  });

  const jump = (event: MouseEvent, id: string): void => {
    const target = document.getElementById(id);
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (target === null || event.button !== 0 || modified) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    focusElement(target, { preventScroll: true });
    replaceHash(`#${id}`);
    active = id;
  };
</script>

{#snippet items(nodes: readonly TocNode[])}
  <ol class="flex flex-col gap-1">
    {#each nodes as node (node.id)}
      <li>
        <a
          href={`#${node.id}`}
          aria-current={active === node.id ? 'location' : undefined}
          class={[
            'link link-hover block border-s-2 py-0.5 ps-3 text-sm',
            active === node.id ? 'border-primary font-medium' : 'border-transparent',
          ]}
          onclick={(event) => jump(event, node.id)}
        >
          {node.label}
        </a>
        {#if node.children.length > 0}
          <div class="ms-3 mt-1">{@render items(node.children)}</div>
        {/if}
      </li>
    {/each}
  </ol>
{/snippet}

<nav
  {...rest}
  aria-labelledby={showLabel && !collapsed ? labelId : undefined}
  aria-label={showLabel && !collapsed ? undefined : label}
  class={[sticky && 'sticky max-h-screen overflow-y-auto', className]}
  style:top={sticky ? cssLength(offset) : undefined}
>
  {#if collapsed}
    <Disclosure title={label}>
      {@render items(tree)}
    </Disclosure>
  {:else}
    {#if showLabel}
      <h2 id={labelId} class="mb-2 text-sm font-semibold">{label}</h2>
    {/if}
    {@render items(tree)}
  {/if}
</nav>
