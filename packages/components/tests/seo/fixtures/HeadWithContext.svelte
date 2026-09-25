<!-- `<Head>` under an app context: an absolute `href` and a fixed locale. -->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import Head from '../../../src/lib/seo/Head.svelte';

  type Props = ComponentProps<typeof Head> & { origin?: string; locale?: string };

  let { origin = 'https://example.org', locale = 'en-AU', ...head }: Props = $props();

  setComponentsContext({
    href: (path) => new URL(path, origin).href,
    locale: () => locale,
  });
</script>

<Head {...head} />
