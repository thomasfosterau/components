<!-- @component
One entry of a vertical `NavigationMenu`: a `Disclosure` of links, or a link; internal, not exported.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getComponentsContext } from '../context.svelte.ts';
  import Disclosure from '../ui/Disclosure.svelte';
  import NavigationLinkBody from './NavigationLinkBody.svelte';
  import { holdsCurrentPage } from './navigation-sections.ts';
  import type { NavigationSection } from './types.ts';

  interface Props {
    section: NavigationSection;
    panel: Snippet<[NavigationSection]> | undefined;
  }

  let { section, panel }: Props = $props();

  const context = getComponentsContext();

  const holdsCurrent = $derived(holdsCurrentPage(section, context.isCurrent));
</script>

{#if section.links !== undefined}
  <Disclosure title={section.label} open={holdsCurrent}>
    {#if panel}
      {@render panel(section)}
    {:else}
      <ul class="flex flex-col gap-1">
        {#each section.links as link (link.href)}
          <li>
            <a
              href={context.href(link.href)}
              aria-current={context.isCurrent(link.href) ? 'page' : undefined}
              class="rounded-field hover:bg-base-200 flex flex-col p-2"
            >
              <NavigationLinkBody {link} />
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </Disclosure>
{:else if section.href !== undefined}
  <a
    href={context.href(section.href)}
    aria-current={context.isCurrent(section.href) ? 'page' : undefined}
    class="rounded-field hover:bg-base-200 block p-2 font-medium"
  >
    {section.label}
  </a>
{/if}
