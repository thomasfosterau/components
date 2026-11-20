<!-- @component
A `NavigationMenu` panel link's title and description; internal, not exported.
-->
<script lang="ts">
  import type { NavigationLink } from './types.ts';

  let { link }: { link: NavigationLink } = $props();
</script>

<span class="font-medium">{link.label}</span>
{#if link.description !== undefined}
  <span class="text-base-content/70 text-sm">{link.description}</span>
{/if}
