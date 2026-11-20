<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Skeleton from '../../lib/ui/Skeleton.svelte';

  const { Story } = defineMeta({
    title: 'UI/Skeleton',
    component: Skeleton,
    parameters: {
      docs: {
        description: {
          component:
            'Placeholders for a surface whose data has not arrived. The shimmer conveys "loading" by animation alone, so the wrapper is a `role="status"` region marked `aria-busy` with a hidden label, and every shimmering box is `aria-hidden`.',
        },
      },
    },
  });
</script>

<Story name="Text" asChild>
  <div class="max-w-md"><Skeleton variant="text" /></div>
</Story>

<Story name="Text, two lines" asChild>
  <div class="max-w-md"><Skeleton variant="text" lines={2} label="Loading description" /></div>
</Story>

<Story name="Block" asChild>
  <div class="max-w-md"><Skeleton /></div>
</Story>

<Story name="Circle" asChild>
  <Skeleton variant="circle" label="Loading avatar" />
</Story>

<Story name="A loading card" asChild>
  <div class="card card-border bg-base-100 max-w-md shadow-sm">
    <div class="card-body flex-row items-start gap-4">
      <Skeleton variant="circle" label="Loading author" />
      <div class="flex-1"><Skeleton variant="text" lines={3} label="Loading post" /></div>
    </div>
  </div>
</Story>
