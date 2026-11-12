<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ErrorSummaryClientDemo from './ErrorSummaryClientDemo.svelte';
  import FormField from '../../lib/fields/FormField.svelte';
  import TextInput from '../../lib/fields/TextInput.svelte';
  import ErrorSummary from '../../lib/forms/ErrorSummary.svelte';
  import type { ErrorSummaryItem } from '../../lib/forms/error-summary.ts';

  const { Story } = defineMeta({
    title: 'Forms/ErrorSummary',
    component: ErrorSummary,
    parameters: {
      docs: {
        description: {
          component:
            'The GOV.UK error summary: after a failed submission, one focused alert listing every field error as a link to the field. Each field still shows its own `FieldErrors`; the summary repeats them on purpose so a long form, or a screen-reader user on a reloaded page, learns at once that it failed and where. The stories leave `titlePrefix` empty so they do not rewrite the Storybook tab title.',
        },
      },
    },
  });

  const bed: ErrorSummaryItem = { fieldId: 'summary-bed-name', message: 'Enter a bed name' };
  const garden: ErrorSummaryItem = { fieldId: 'summary-garden', message: 'Choose a garden' };
</script>

<Story name="Server-rendered errors">
  <form class="space-y-4">
    <ErrorSummary
      titlePrefix=""
      errors={[bed, garden]}
      formErrors={['Your session expired while you were writing.']}
    />
    <FormField id="summary-bed-name" label="Bed name" errors={['Enter a bed name']}>
      {#snippet children(control)}<TextInput {...control} name="name" />{/snippet}
    </FormField>
    <FormField id="summary-garden" label="Garden" errors={['Choose a garden']}>
      {#snippet children(control)}<TextInput {...control} name="garden" />{/snippet}
    </FormField>
  </form>
</Story>

<Story name="From a record">
  <ErrorSummary
    titlePrefix=""
    autofocus={false}
    formId="bed"
    errors={{ name: ['Enter a bed name'], garden: ['Choose a garden'], notes: [] }}
  />
</Story>

<Story name="Client validation">
  <ErrorSummaryClientDemo />
</Story>

<Story name="Long form">
  <form class="space-y-4">
    <ErrorSummary titlePrefix="" autofocus={false} errors={[bed, garden]} />
    <div class="bg-base-200 text-base-content/70 h-[80vh] rounded p-4 text-sm">
      A long stretch of form. The links below scroll the label, not just the input, into view.
    </div>
    <FormField id="summary-bed-name" label="Bed name" errors={['Enter a bed name']}>
      {#snippet children(control)}<TextInput {...control} name="name" />{/snippet}
    </FormField>
    <FormField id="summary-garden" label="Garden" errors={['Choose a garden']}>
      {#snippet children(control)}<TextInput {...control} name="garden" />{/snippet}
    </FormField>
  </form>
</Story>
