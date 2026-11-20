<!-- @component
One top-level entry of a horizontal `NavigationMenu`: a trigger and its panel, or a link; internal, not exported.
-->
<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import { NavigationMenu } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import { getComponentsContext } from '../context.svelte.ts';
  import NavigationMenuPanel from './NavigationMenuPanel.svelte';
  import { holdsCurrentPage } from './navigation-sections.ts';
  import type { NavigationSection } from './types.ts';

  interface Props {
    section: NavigationSection;
    openOnHover: boolean;
    panel: Snippet<[NavigationSection]> | undefined;
  }

  let { section, openOnHover, panel }: Props = $props();

  const context = getComponentsContext();

  const holdsCurrent = $derived(holdsCurrentPage(section, context.isCurrent));
</script>

<NavigationMenu.Item value={section.label} {openOnHover} class="relative">
  {#if section.links !== undefined}
    <NavigationMenu.Trigger
      class="btn btn-ghost btn-sm group"
      aria-current={holdsCurrent ? 'true' : undefined}
    >
      {section.label}
      <ChevronDown
        class="size-4 group-data-[state=open]:rotate-180 motion-safe:transition-transform"
        aria-hidden="true"
      />
    </NavigationMenu.Trigger>
    <NavigationMenu.Content
      class="card card-border bg-base-100 rounded-box absolute start-0 top-full z-50 mt-2 w-[min(32rem,90vw)] p-4 shadow-md"
    >
      {#if panel}
        {@render panel(section)}
      {:else}
        <NavigationMenuPanel links={section.links} />
      {/if}
    </NavigationMenu.Content>
  {:else if section.href !== undefined}
    <NavigationMenu.Link
      href={context.href(section.href)}
      active={context.isCurrent(section.href)}
      aria-current={context.isCurrent(section.href) ? 'page' : undefined}
      class="btn btn-ghost btn-sm"
    >
      {section.label}
    </NavigationMenu.Link>
  {/if}
</NavigationMenu.Item>
