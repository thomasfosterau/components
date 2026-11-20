<script lang="ts">
  import NavigationProgress from '../../../src/lib/feedback/NavigationProgress.svelte';
  import {
    setNavigationProgress,
    type NavigationProgressApi,
  } from '../../../src/lib/feedback/navigation-progress.svelte.ts';

  interface Props {
    /** Handed the store the fixture published. */
    onReady: (api: NavigationProgressApi) => void;
  }

  let { onReady }: Props = $props();

  // svelte-ignore state_referenced_locally
  onReady(setNavigationProgress());
</script>

<NavigationProgress delay={0} />
