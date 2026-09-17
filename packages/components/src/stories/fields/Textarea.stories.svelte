<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import Textarea from '../../lib/fields/Textarea.svelte';

  const { Story } = defineMeta({
    title: 'Fields/Textarea',
    component: Textarea,
    parameters: {
      docs: {
        description: {
          component:
            'A native `<textarea>` in daisyUI `textarea` styling, with the same `FieldControl` wiring as `TextInput`. `rows` defaults to 4.',
        },
      },
    },
  });
</script>

<Story name="Default">
  <div class="max-w-lg">
    <FormField label="Notes" hint="Anything a later reader would want to know.">
      {#snippet children(control)}
        <Textarea
          {...control}
          value={'Two of six seedlings survived the frost on 14 September.\nThe survivors are both in the north bed.'}
        />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Taller, and invalid">
  <div class="max-w-lg">
    <FormField label="Description" errors={['Keep this under 500 characters.']}>
      {#snippet children(control)}
        <Textarea {...control} rows={8} value="A vigorous climber with arching stems…" />
      {/snippet}
    </FormField>
  </div>
</Story>
