<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FieldErrors from '../../lib/fields/FieldErrors.svelte';

  const { Story } = defineMeta({
    title: 'Fields/FieldErrors',
    component: FieldErrors,
    parameters: {
      docs: {
        description: {
          component:
            'The validation messages under one control. `FormField` renders this for you; reach for it directly only on a page that builds its own frame. The container is the live region — one interruption, then all the messages — and nothing is rendered while the list is empty.',
        },
      },
    },
  });
</script>

<Story name="One message">
  <FieldErrors errors={['That name is already recorded.']} />
</Story>

<Story name="Several messages">
  <FieldErrors
    errors={[
      'That name is already recorded.',
      'The genus must be capitalised.',
      'The epithet must not be.',
    ]}
  />
</Story>

<Story name="Empty renders nothing">
  <div class="text-base-content/70 text-sm">
    <FieldErrors errors={[]} />
    (nothing above this line)
  </div>
</Story>
