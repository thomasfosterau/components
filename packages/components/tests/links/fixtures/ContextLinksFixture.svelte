<!-- `ContextLinks` under a locale-prefixing `href`. -->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import ContextLinks from '../../../src/lib/links/ContextLinks.svelte';

  let props: ComponentProps<typeof ContextLinks> = $props();

  setComponentsContext({ href: (path) => `/en${path}` });
</script>

<ContextLinks {...props} />
