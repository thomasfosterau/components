<script lang="ts">
  import ConsentBanner from '../../../src/lib/feedback/ConsentBanner.svelte';
  import type { ConsentApi } from '../../../src/lib/feedback/consent.svelte.ts';

  interface Props {
    consent: ConsentApi;
    action?: string | undefined;
    settingsHref?: string | undefined;
  }

  let { consent, action, settingsHref }: Props = $props();
</script>

<ConsentBanner {consent} {action} {settingsHref}>
  <p>We’d like to set analytics cookies to understand how you use the garden planner.</p>
</ConsentBanner>
<main><h1>Garden planner</h1></main>
