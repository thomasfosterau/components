<!-- Children that hold state, so the test can prove they stay MOUNTED through
     `refreshing` rather than merely being re-rendered: the counter survives
     only if the subtree was never torn down. -->
<script lang="ts">
  import LoadingBoundary from '../../../src/lib/feedback/LoadingBoundary.svelte';
  import Counter from './Counter.svelte';

  interface Props {
    state?: 'loading' | 'refreshing' | 'error' | 'ready';
    tone?: 'page' | 'section' | undefined;
    loadingLabel?: string | undefined;
    errorLabel?: string | undefined;
  }

  let { state = 'loading', tone, loadingLabel, errorLabel }: Props = $props();
</script>

<LoadingBoundary {state} {tone} {loadingLabel} {errorLabel}>
  <Counter />
</LoadingBoundary>
