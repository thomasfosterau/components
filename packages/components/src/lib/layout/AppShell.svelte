<!-- @component
The responsive app frame: the sidebar as a standing column from `lg` up, and in a navigation drawer below it.
-->
<!--
  AppShell — the frame every app with a `Sidebar` rebuilt by hand. From
  `lg` up the `sidebar` snippet is a plain column beside the content; below
  `lg` it moves into a `Drawer` (`side="start"`) opened from a top bar's
  menu button.

  The persistent column is never inside a dialog. The sidebar renders in
  two places, but the column is `display: none` below `lg` and the drawer
  only exists while it is open (and only its trigger bar below `lg`), so
  exactly one copy, and one `navigation` landmark, is in the accessibility
  tree at any width.

  Closing the drawer on navigation is the app's job, because a library
  cannot import `$app/navigation`. Bind `navOpen` and reset it in
  SvelteKit's `afterNavigate(() => (navOpen = false))`, as with
  `Navbar`'s `menuOpen`.
-->
<script lang="ts">
  import { Menu as MenuIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Drawer from '../feedback/Drawer.svelte';
  import Button from '../ui/Button.svelte';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The sidebar, usually a `Sidebar`: a column from `lg` up, the drawer's body below. */
    sidebar: Snippet<[]>;
    /** The top bar below `lg`; spread `triggerProps` onto the menu button. Omitted, a bar with a menu button. */
    header?: Snippet<[{ triggerProps: Record<string, unknown> }]> | undefined;
    /** The page content. */
    children: Snippet<[]>;
    /** Whether the narrow-viewport drawer is open. Bindable. */
    navOpen?: boolean | undefined;
    /**
     * Accessible name of the default menu button.
     * @defaultValue `'Menu'`
     */
    navLabel?: string | undefined;
    /**
     * The drawer's accessible name.
     * @defaultValue `'Navigation'`
     */
    navTitle?: string | undefined;
  }

  let {
    sidebar,
    header,
    children,
    navOpen = $bindable(false),
    navLabel = 'Menu',
    navTitle = 'Navigation',
    class: className,
    ...rest
  }: Props = $props();
</script>

<div {...rest} class={['min-h-svh lg:flex', className]}>
  <div class="hidden shrink-0 lg:block">{@render sidebar()}</div>
  <div class="min-w-0 flex-1">
    <div class="lg:hidden">
      <Drawer bind:open={navOpen} title={navTitle} hideTitle side="start" size="sm">
        {#snippet trigger({ props })}
          {#if header}
            {@render header({ triggerProps: props })}
          {:else}
            <div class="border-base-300 bg-base-100 flex h-14 items-center border-b px-2">
              <Button {...props} variant="ghost" class="btn-square">
                <MenuIcon class="size-5" aria-hidden="true" />
                <VisuallyHidden>{navLabel}</VisuallyHidden>
              </Button>
            </div>
          {/if}
        {/snippet}
        {@render sidebar()}
      </Drawer>
    </div>
    {@render children()}
  </div>
</div>
