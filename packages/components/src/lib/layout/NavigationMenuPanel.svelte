<!-- @component
The links in a horizontal `NavigationMenu` panel; internal, not exported.
-->
<script lang="ts">
  import { NavigationMenu } from 'bits-ui';
  import { getComponentsContext } from '../context.svelte.ts';
  import NavigationLinkBody from './NavigationLinkBody.svelte';
  import type { NavigationLink } from './types.ts';

  let { links }: { links: readonly NavigationLink[] } = $props();

  const context = getComponentsContext();
</script>

<ul class="grid gap-2 sm:grid-cols-2">
  {#each links as link (link.href)}
    {@const current = context.isCurrent(link.href)}
    <li>
      <NavigationMenu.Link
        href={context.href(link.href)}
        active={current}
        aria-current={current ? 'page' : undefined}
        class="rounded-field hover:bg-base-200 focus-visible:outline-primary flex flex-col p-2 focus-visible:outline-2"
      >
        <NavigationLinkBody {link} />
      </NavigationMenu.Link>
    </li>
  {/each}
</ul>
