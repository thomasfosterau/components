<!-- `isCurrent` is injected rather than left to the default (which compares
     against the test runner's own pathname). -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import Menu from '../../../src/lib/ui/Menu.svelte';
  import MenuItem from '../../../src/lib/ui/MenuItem.svelte';
  import MenuSeparator from '../../../src/lib/ui/MenuSeparator.svelte';

  interface Props {
    currentHref?: string;
    label?: string;
  }

  let { currentHref = '/gardens', label = 'Primary' }: Props = $props();

  setComponentsContext({ isCurrent: (href) => href === currentHref });
</script>

<Menu {label}>
  <MenuItem href="/gardens">Gardens</MenuItem>
  <MenuItem href="/taxa">Taxa</MenuItem>
  <MenuSeparator />
  <MenuItem href="/admin" disabled>Moderation</MenuItem>
</Menu>
