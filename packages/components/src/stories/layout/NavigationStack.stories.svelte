<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import NavigationStack from '../../lib/layout/NavigationStack.svelte';
  import NavigationStackDemo from './NavigationStackDemo.svelte';

  const { Story } = defineMeta({
    title: 'Layout/NavigationStack',
    component: NavigationStack,
    parameters: {
      docs: {
        description: {
          component:
            'Drill-down screens. Open a bed, then a planting, then go Back: each push slides in and focuses the new title, each pop slides back and returns focus to the row you opened. A stand-in router drives the story; in an app, SvelteKit’s `onNavigate` reports to the stack.',
        },
      },
    },
  });
</script>

<Story name="Beds drill-down" asChild>
  <NavigationStackDemo />
</Story>

<Story name="Right to left" asChild>
  <NavigationStackDemo rtl />
</Story>
