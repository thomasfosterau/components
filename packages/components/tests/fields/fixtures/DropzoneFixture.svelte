<script lang="ts">
  import Dropzone from '../../../src/lib/fields/Dropzone.svelte';
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import type { FileRejection } from '../../../src/lib/fields/file-validation.ts';

  interface Props {
    files?: File[] | undefined;
    accept?: string | undefined;
    maxBytes?: number | undefined;
    maxFiles?: number | undefined;
    multiple?: boolean | undefined;
    onSelect?: ((accepted: readonly File[], rejected: readonly FileRejection[]) => void) | undefined;
    /** Called when the wrapping form submits, with what it would post. */
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let {
    files = $bindable([]),
    accept,
    maxBytes,
    maxFiles,
    multiple,
    onSelect,
    onSubmitted,
  }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Attachments" hint="Photos or PDFs.">
    {#snippet children(control)}
      <Dropzone
        {...control}
        name="attachments"
        {accept}
        {maxBytes}
        {maxFiles}
        {multiple}
        {onSelect}
        locales="en-AU"
        data-testid="zone"
        bind:files
      />
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
<p data-testid="bound">{files.map((entry) => entry.name).join('|')}</p>
