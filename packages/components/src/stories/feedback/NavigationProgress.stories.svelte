<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import NavigationProgress from '../../lib/feedback/NavigationProgress.svelte';
  import { createNavigationProgress } from '../../lib/feedback/navigation-progress.svelte.ts';
  import Button from '../../lib/ui/Button.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/NavigationProgress',
    component: NavigationProgress,
    parameters: {
      docs: {
        description: {
          component:
            'The thin bar across the top of the viewport during a client-side navigation. Nothing shows for operations shorter than `delay`; the trickle has no `aria-valuenow`, and `set(n)` reports a real percentage. In SvelteKit, wire `navigating` to the store in the root layout.',
        },
      },
    },
  });
</script>

<script lang="ts">
  const progress = createNavigationProgress();

  const navigate = (latency: number): void => {
    progress.start();
    setTimeout(() => progress.done(), latency);
  };

  const upload = (): void => {
    progress.set(0);
    const tick = setInterval(() => {
      progress.increment(0.1);
      if ((progress.value ?? 0) >= 1) {
        clearInterval(tick);
        progress.done();
      }
    }, 200);
  };
</script>

<Story name="Simulated navigation">
  <NavigationProgress {progress} />
  <div class="flex flex-wrap gap-2">
    <Button onclick={() => navigate(100)}>Fast page (100 ms)</Button>
    <Button onclick={() => navigate(1500)}>Slow page (1.5 s)</Button>
    <Button onclick={() => navigate(4000)}>Very slow page (4 s)</Button>
    <Button onclick={upload}>Upload with real progress</Button>
  </div>
</Story>
