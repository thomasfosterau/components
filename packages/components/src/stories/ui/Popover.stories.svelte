<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from '../../lib/ui/Button.svelte';
  import Popover from '../../lib/ui/Popover.svelte';

  const { Story } = defineMeta({
    title: 'UI/Popover',
    component: Popover,
    parameters: {
      docs: {
        description: {
          component:
            'A small floating panel that holds interactive content: it takes focus, closes on Escape and on an outside click, and returns focus to the trigger — all of it bits-ui’s. `title` becomes the panel’s accessible name.',
        },
      },
    },
  });
</script>

<Story name="With a title">
  <div class="p-10">
    <Popover title="Filter observations">
      {#snippet trigger({ props })}
        <Button {...props} variant="outline">Filters</Button>
      {/snippet}
      <form class="flex flex-col gap-2">
        <label class="label cursor-pointer justify-start gap-2">
          <input type="checkbox" class="checkbox checkbox-sm" checked />
          <span class="label-text">Flowering</span>
        </label>
        <label class="label cursor-pointer justify-start gap-2">
          <input type="checkbox" class="checkbox checkbox-sm" />
          <span class="label-text">Fruiting</span>
        </label>
      </form>
    </Popover>
  </div>
</Story>

<Story name="Untitled, aligned to the start">
  <div class="p-10">
    <Popover align="start" side="bottom" closeLabel="Close this panel">
      {#snippet trigger({ props })}
        <Button {...props} tone="primary">What is a cultivar?</Button>
      {/snippet}
      <p class="text-sm">
        A cultivar is a plant selected and propagated for traits it keeps when grown on. Without a
        title, label the panel from the call site.
      </p>
    </Popover>
  </div>
</Story>
