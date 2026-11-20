<!-- `<Head>` under site-wide defaults from `setSeoContext`. -->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Head from '../../../src/lib/seo/Head.svelte';
  import { setSeoContext, type SeoContext } from '../../../src/lib/seo/context.ts';

  type Props = ComponentProps<typeof Head> & { site: SeoContext };

  let { site, ...head }: Props = $props();

  // svelte-ignore state_referenced_locally
  setSeoContext(site);
</script>

<Head {...head} />
