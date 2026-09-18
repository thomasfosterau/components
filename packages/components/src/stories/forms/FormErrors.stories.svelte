<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormErrors from '../../lib/forms/FormErrors.svelte';

  const { Story } = defineMeta({
    title: 'Forms/FormErrors',
    component: FormErrors,
    parameters: {
      docs: {
        description: {
          component:
            'The whole-form messages — the ones with no field to attach to. One `Alert live="assertive"` per message: these appear in response to something the reader just did, and the next thing they will do is try again.',
        },
      },
    },
  });
</script>

<Story name="One message">
  <FormErrors messages={['That garden name is already taken.']} />
</Story>

<Story name="Several messages">
  <div class="flex flex-col gap-3">
    <FormErrors
      messages={[
        'That garden name is already taken.',
        'Your session expired while you were writing — sign in and submit again.',
      ]}
    />
  </div>
</Story>

<Story name="A different tone">
  <FormErrors tone="warning" messages={['Saved, but two photographs could not be attached.']} />
</Story>

<Story name="Nothing to say">
  <div class="text-base-content/70 text-sm">
    <FormErrors messages={[]} />
    (nothing above this line)
  </div>
</Story>
