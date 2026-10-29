<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import HStack from '../../lib/layout/HStack.svelte';
  import Spacer from '../../lib/layout/Spacer.svelte';

  const { Story } = defineMeta({ title: 'Layout/Spacer', component: Spacer });
</script>

<Story name="Push to the end">
  <HStack align="center" class="max-w-md">
    <button type="button" class="btn btn-ghost">Back</button>
    <Spacer />
    <button type="button" class="btn btn-primary">Next</button>
  </HStack>
</Story>
