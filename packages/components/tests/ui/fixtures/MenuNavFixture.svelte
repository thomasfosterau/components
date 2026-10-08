<!-- `isCurrent` is injected rather than left to the default (which compares
     against the test runner's own pathname). `href` is forwarded
     unconditionally, the way an app wiring its own optional resolver does: an
     omitted one arrives as an explicit `undefined`, so this file only
     type-checks while `setComponentsContext` accepts `T | undefined` per
     member (#76), and the Menu test pins that it falls back to the default. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import Menu from '../../../src/lib/ui/Menu.svelte';
  import MenuItem from '../../../src/lib/ui/MenuItem.svelte';
  import MenuSeparator from '../../../src/lib/ui/MenuSeparator.svelte';

  interface Props {
    currentHref?: string | undefined;
    label?: string | undefined;
    href?: ((path: string) => string) | undefined;
  }

  let { currentHref = '/gardens', label = 'Primary', href }: Props = $props();

  // The context is set once, at mount, so the initial `href` is the one meant.
  setComponentsContext({
    isCurrent: (path) => path === currentHref,
    href: untrack(() => href),
  });
</script>

<Menu {label}>
  <MenuItem href="/gardens">Gardens</MenuItem>
  <MenuItem href="/taxa">Taxa</MenuItem>
  <MenuSeparator />
  <MenuItem href="/admin" disabled>Moderation</MenuItem>
</Menu>
