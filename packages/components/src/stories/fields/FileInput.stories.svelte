<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FileInput from '../../lib/fields/FileInput.svelte';
  import FormField from '../../lib/fields/FormField.svelte';

  const { Story } = defineMeta({
    title: 'Fields/FileInput',
    component: FileInput,
    parameters: {
      docs: {
        description: {
          component:
            'A native file input with the chosen `File` exposed as a bindable prop and a client-side size cap. It uploads nothing — the transfer belongs to the caller. An over-size file is cleared from the control rather than left sitting in it, so what the control shows and what `file` holds cannot disagree.',
        },
      },
    },
  });
</script>

<script lang="ts">
  let chosen = $state<File | undefined>();
</script>

<Story name="Default">
  <div class="max-w-md">
    <FormField label="Attachment" hint="PDF or plain text.">
      {#snippet children(control)}
        <FileInput {...control} accept="application/pdf,text/plain" bind:file={chosen} />
      {/snippet}
    </FormField>
    <p class="text-base-content/70 mt-3 text-sm">
      Chosen: {chosen?.name ?? 'nothing'}
    </p>
  </div>
</Story>

<Story name="With a size cap">
  <div class="max-w-md">
    <FormField label="Attachment" hint="Up to 1 kB, so anything real will be refused.">
      {#snippet children(control)}
        <FileInput
          {...control}
          maxBytes={1024}
          tooLargeMessage="That file is larger than 1 kB."
        />
      {/snippet}
    </FormField>
  </div>
</Story>
