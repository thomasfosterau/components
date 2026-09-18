<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import ImageInput from '../../lib/fields/ImageInput.svelte';

  const { Story } = defineMeta({
    title: 'Fields/ImageInput',
    component: ImageInput,
    parameters: {
      docs: {
        description: {
          component:
            'A `FileInput` that also measures the picture and previews it. The dimensions are read in the browser with `createImageBitmap` — a server cannot do it cheaply — so the form can submit them and the page that later renders the image can reserve its box on first paint. The preview is an object URL, revoked as soon as it is replaced.',
        },
      },
    },
  });
</script>

<script lang="ts">
  let width = $state<number | undefined>();
  let height = $state<number | undefined>();
</script>

<Story name="Default">
  <div class="max-w-md">
    <FormField label="Photograph" hint="JPEG, PNG, WebP or AVIF.">
      {#snippet children(control)}
        <ImageInput {...control} name="file" bind:width bind:height />
      {/snippet}
    </FormField>
    <p class="text-base-content/70 mt-3 text-sm">
      Measured: {width !== undefined && height !== undefined ? `${width} × ${height}` : 'nothing yet'}
    </p>
  </div>
</Story>

<Story name="With a size cap">
  <div class="max-w-md">
    <FormField label="Photograph" errors={['Choose a photograph.']}>
      {#snippet children(control)}
        <ImageInput
          {...control}
          maxBytes={2_000_000}
          tooLargeMessage="That photograph is larger than 2 MB."
          previewAlt="The photograph you chose"
        />
      {/snippet}
    </FormField>
  </div>
</Story>
