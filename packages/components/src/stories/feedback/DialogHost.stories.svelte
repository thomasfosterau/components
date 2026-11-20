<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import DialogHost from '../../lib/feedback/DialogHost.svelte';
  import DialogsDemo from './DialogsDemo.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/DialogHost',
    component: DialogHost,
    parameters: {
      docs: {
        description: {
          component:
            'Opens `ConfirmDialog`, `PromptDialog` or an alert from code: `await getDialogs().confirm({ title })` resolves `true` or `false`. Requests queue one at a time; focus returns to the element focused at request time, or its nearest focusable ancestor if it is gone.',
        },
      },
    },
  });
</script>

<Story name="Keyboard delete and an async flow">
  <DialogHost>
    <DialogsDemo />
  </DialogHost>
</Story>
