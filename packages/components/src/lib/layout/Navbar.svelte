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
-->
<script lang="ts">
  import { Collapsible } from 'bits-ui';
  import { Menu as MenuIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';

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
  }

  let {
    label = 'Primary',
    menuLabel = 'Menu',
    menuOpen = $bindable(false),
    start,
    center,
    end,
    menu,
    class: className,
    ...rest
  }: Props = $props();
</script>

<Collapsible.Root bind:open={menuOpen}>
  {#snippet child({ props })}
    <header {...rest} {...props} class={['bg-base-200 border-base-300 border-b', className]}>
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
                <button {...triggerProps} class="btn btn-ghost btn-square lg:hidden">
                  <MenuIcon class="size-5" aria-hidden="true" />
                  <VisuallyHidden>{menuLabel}</VisuallyHidden>
                </button>
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
