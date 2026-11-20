<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import Navbar from '../../../src/lib/layout/Navbar.svelte';
  import NavigationMenu from '../../../src/lib/layout/NavigationMenu.svelte';
  import type { NavigationSection } from '../../../src/lib/layout/types.ts';

  interface Props {
    currentHref?: string | undefined;
    orientation?: 'horizontal' | 'vertical' | undefined;
  }

  let { currentHref = '/', orientation }: Props = $props();

  setComponentsContext({
    isCurrent: (href) => href === currentHref,
    href: (path) => `/app${path}`,
  });

  const sections: NavigationSection[] = [
    {
      label: 'Plants',
      links: [
        { label: 'Trees', href: '/plants/trees', description: 'Fruit, shade and hedging.' },
        { label: 'Shrubs', href: '/plants/shrubs' },
      ],
    },
    { label: 'Guides', links: [{ label: 'By season', href: '/guides/season' }] },
    { label: 'About', href: '/about' },
  ];
</script>

<Navbar label="Primary">
  {#snippet start()}<a href="/" rel="home">Garden</a>{/snippet}
  {#snippet center()}
    <NavigationMenu {sections} {orientation} openOnHover={false} />
  {/snippet}
</Navbar>
