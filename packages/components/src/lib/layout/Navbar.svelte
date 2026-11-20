<!-- @component
The site banner: brand, primary links and account controls, with a disclosure for what does not fit on a narrow viewport.
-->
<!--
  Navbar — the site's banner: the brand, the primary links, the account
  controls, and on a narrow viewport the disclosure that holds whatever did
  not fit.

  The three regions are snippets (`start` / `center` / `end`) because the
  content is the app's — its brand mark, its search form, its `DropdownMenu`
  account menu. What this owns is the structure: the banner
  landmark, the named navigation inside it, the responsive bar, and the
  toggle.

  The toggle is bits-ui's `Collapsible`, not a hand-rolled button and a
  `hidden` div (which is what three of the four apps had) and not a
  `<details>`. `<details>` would be tempting — it is the native disclosure —
  but its ARIA is implicit: the browser maps the open state internally and
  exposes no `aria-controls`, so the toggle cannot say WHICH region it opens,
  and a `<summary>` cannot be styled as a `btn` without fighting the marker.
  `Collapsible` gives the pairing this needs and nothing else: a real
  `<button type="button">` carrying `aria-expanded` and `aria-controls`
  pointing at the panel's id, and the panel kept in the DOM with `hidden` when
  closed so the reference always resolves.

  ARIA contract: `<header>` at the top of the document is the `banner`
  landmark; the `<nav aria-label>` inside it is the named navigation. The
  toggle is an icon button with a real accessible name (`menuLabel`) — its
  glyph is `aria-hidden`, so the name never changes as the state does; the
  state is `aria-expanded`'s job, not the label's. `menuOpen` is bindable, so
  an app can close the panel after a route change.

  Scroll behaviours: `pinned` keeps the bar at the top; `hide-on-scroll`
  slides it away scrolling down and back scrolling up, and back the moment
  anything in it takes focus, so a keyboard user never tabs into a hidden
  bar (under reduced motion it stays pinned). Either sets `--navbar-offset`
  and `scroll-padding-top` on the scroller, so anchors land below the bar.
  `elevateOnScroll` draws the border and shadow only once content is under
  the bar.
-->
<script lang="ts">
  import { Collapsible } from 'bits-ui';
  import { Menu as MenuIcon } from '@lucide/svelte';
  import { untrack, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import {
    nextHidden,
    reducedMotion,
    watchScroll,
    type NavbarScrollBehavior,
  } from './scroll-behavior.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    /**
     * Accessible name of the `<nav>` landmark.
     * @defaultValue `'Primary'`
     */
    label?: string | undefined;
    /**
     * Accessible name of the responsive menu toggle.
     * @defaultValue `'Menu'`
     */
    menuLabel?: string | undefined;
    /** Whether the responsive panel is open. Bindable. */
    menuOpen?: boolean | undefined;
    /** Leading region — the brand link. */
    start: Snippet<[]>;
    /** Middle region — the primary links. Hidden below `lg`. */
    center?: Snippet<[]> | undefined;
    /** Trailing region — search, theme, account. */
    end?: Snippet<[]> | undefined;
    /**
     * The panel the toggle opens. Given one, the toggle appears below `lg`;
     * without one there is nothing to disclose and no button is rendered.
     */
    menu?: Snippet<[]> | undefined;
    /**
     * How the bar responds to scrolling: in the flow, stuck to the top, or
     * stuck and hidden while scrolling down.
     * @defaultValue `'static'`
     */
    scrollBehavior?: NavbarScrollBehavior | undefined;
    /**
     * Show the border and shadow only once content scrolls under the bar.
     * @defaultValue `true` when `scrollBehavior` is not `'static'`
     */
    elevateOnScroll?: boolean | undefined;
    /** The element that scrolls, when it is not the window. */
    scrollContainer?: HTMLElement | undefined;
  }

  let {
    label = 'Primary',
    menuLabel = 'Menu',
    menuOpen = $bindable(false),
    start,
    center,
    end,
    menu,
    scrollBehavior = 'static',
    elevateOnScroll,
    scrollContainer,
    class: className,
    onfocusin,
    onfocusout,
    ...rest
  }: Props = $props();

  const stuck = $derived(scrollBehavior !== 'static');
  const elevate = $derived(elevateOnScroll ?? stuck);

  let bar: HTMLElement | undefined = $state();
  let height = $state(0);
  let scrolled = $state(false);
  let hidden = $state(false);
  let focused = false;

  $effect(() => {
    if (!stuck && !elevate) return;
    const hides = scrollBehavior === 'hide-on-scroll';
    let previous = 0;
    return watchScroll(scrollContainer, (top) => {
      untrack(() => {
        scrolled = top > 0;
        hidden = hides && !focused && !reducedMotion() && nextHidden(hidden, top, previous, height);
      });
      previous = top;
    });
  });

  $effect(() => {
    if (bar === undefined || !stuck) return;
    const observer = new ResizeObserver(() => {
      height = bar?.offsetHeight ?? 0;
    });
    observer.observe(bar);
    return () => observer.disconnect();
  });

  // Anchors and focused elements land below a stuck bar.
  $effect(() => {
    if (!stuck) return;
    const scroller = scrollContainer ?? document.documentElement;
    const before = scroller.style.scrollPaddingTop;
    scroller.style.setProperty('--navbar-offset', `${hidden ? 0 : height}px`);
    scroller.style.scrollPaddingTop = 'var(--navbar-offset)';
    return () => {
      scroller.style.removeProperty('--navbar-offset');
      scroller.style.scrollPaddingTop = before;
    };
  });

  const onFocusIn = (event: FocusEvent & { currentTarget: EventTarget & HTMLElement }): void => {
    focused = true;
    hidden = false;
    onfocusin?.(event);
  };

  const onFocusOut = (event: FocusEvent & { currentTarget: EventTarget & HTMLElement }): void => {
    focused = event.currentTarget.contains(event.relatedTarget as Node | null);
    onfocusout?.(event);
  };

  const border = $derived(
    !elevate ? 'border-base-300' : scrolled ? 'border-base-300 shadow-sm' : 'border-transparent',
  );
</script>

<Collapsible.Root bind:open={menuOpen}>
  {#snippet child({ props })}
    <header
      {...rest}
      {...props}
      bind:this={bar}
      data-scrolled={elevate && scrolled ? '' : undefined}
      class={[
        'bg-base-200 border-b',
        border,
        stuck && 'sticky top-0 z-40',
        stuck && 'transition-[transform,box-shadow] duration-200 motion-reduce:transition-none',
        className,
      ]}
      style:position={stuck ? 'sticky' : undefined}
      style:top={stuck ? '0' : undefined}
      style:transform={hidden ? 'translateY(-100%)' : undefined}
      onfocusin={onFocusIn}
      onfocusout={onFocusOut}
    >
      <nav aria-label={label} class="navbar mx-auto max-w-7xl px-4 sm:px-6">
        <div class="navbar-start min-w-0">{@render start()}</div>
        {#if center}
          <div class="navbar-center hidden lg:flex">{@render center()}</div>
        {/if}
        <div class="navbar-end gap-2">
          {#if end}{@render end()}{/if}
          {#if menu}
            <Collapsible.Trigger>
              {#snippet child({ props: triggerProps })}
                <IconButtonCore {...triggerProps} label={menuLabel} class="lg:hidden">
                  {#snippet icon()}<MenuIcon class="size-5" />{/snippet}
                </IconButtonCore>
              {/snippet}
            </Collapsible.Trigger>
          {/if}
        </div>
      </nav>
      {#if menu}
        <Collapsible.Content class="border-base-300 border-t px-4 py-3 lg:hidden">
          {@render menu()}
        </Collapsible.Content>
      {/if}
    </header>
  {/snippet}
</Collapsible.Root>
