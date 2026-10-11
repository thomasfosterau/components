<!-- `Sidebar` with its brand and footer regions and a list of `MenuItem`s.
     `isCurrent` is injected so the current-page marking is not left to the
     test runner's own pathname. The optional regions are passed as props
     because a `{#snippet}` inside an `{#if}` is a local, not a prop. -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import Sidebar from '../../../src/lib/layout/Sidebar.svelte';
  import Menu from '../../../src/lib/ui/Menu.svelte';
  import MenuItem from '../../../src/lib/ui/MenuItem.svelte';

  interface Props {
    label?: string | undefined;
    title?: string | undefined;
    withRegions?: boolean;
    currentHref?: string;
  }

  let { label, title, withRegions = false, currentHref = '/gardens' }: Props = $props();

  setComponentsContext({ isCurrent: (href) => href === currentHref });
</script>

{#snippet brand()}
  <a href="/" rel="home" data-testid="sidebar-brand">Blog</a>
{/snippet}
{#snippet footer()}
  <Menu label="Account">
    <MenuItem href="/account">Ada Lovelace</MenuItem>
  </Menu>
{/snippet}

<Sidebar
  {label}
  {title}
  brand={withRegions ? brand : undefined}
  footer={withRegions ? footer : undefined}
>
  <MenuItem href="/gardens">Gardens</MenuItem>
  <MenuItem href="/taxa">Taxa</MenuItem>
</Sidebar>
