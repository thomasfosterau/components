<!-- A BottomNav under a context that prefixes hrefs with /en and treats
     /en/gardens as the current page. -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import BottomNav from '../../../src/lib/layout/BottomNav.svelte';
  import BottomNavItem from '../../../src/lib/layout/BottomNavItem.svelte';

  interface Props {
    fixed?: boolean | undefined;
  }

  let { fixed = false }: Props = $props();

  setComponentsContext({
    href: (path) => `/en${path}`,
    isCurrent: (resolved) => resolved === '/en/gardens',
  });
</script>

{#snippet icon()}
  <svg viewBox="0 0 16 16" data-testid="icon"><circle cx="8" cy="8" r="6" /></svg>
{/snippet}

<BottomNav {fixed}>
  <BottomNavItem href="/gardens" label="Gardens" {icon} />
  <BottomNavItem href="/taxa" label="Taxa" {icon} />
  <BottomNavItem href="/notifications" label="Notifications" badge={3} {icon} />
</BottomNav>
