<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SaveBar from '../../lib/forms/SaveBar.svelte';
  import SaveBarDemo from './SaveBarDemo.svelte';

  const { Story } = defineMeta({
    title: 'Forms/SaveBar',
    component: SaveBar,
    parameters: {
      docs: {
        description: {
          component:
            'The contextual save bar: nothing while the form is clean; from the first edit it sticks to the top or bottom of its container with "Unsaved changes", Discard and Save. Discard asks first. A polite status region announces the bar once when it appears and "Saved" when it goes away. Save is a submit button tied to a form by `form`, or runs `onSave`.',
        },
      },
    },
  });
</script>

<Story name="Settings form">
  <SaveBarDemo />
</Story>

<Story name="At the top">
  <SaveBarDemo position="top" />
</Story>

<Story name="Saving">
  <SaveBar dirty saving />
</Story>

<Story name="Clean">
  <SaveBar dirty={false} />
</Story>
