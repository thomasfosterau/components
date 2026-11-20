<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import ImageInput from '../../lib/fields/ImageInput.svelte';
  import type { CropArea } from '../../lib/fields/crop.ts';

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
  let avatarArea = $state<CropArea | undefined>();
  let coverFile = $state<File | undefined>();
</script>

<Story name="Default" asChild>
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

<Story name="Crop to an avatar" asChild>
  <div class="max-w-md">
    <FormField label="Profile photo" hint="You can frame it after choosing.">
      {#snippet children(control)}
        <ImageInput
          {...control}
          name="avatar"
          crop={{ aspect: 1, round: true }}
          previewAlt="Your profile photo"
          bind:area={avatarArea}
        />
      {/snippet}
    </FormField>
    <p class="text-base-content/70 mt-3 text-sm">
      Crop: {avatarArea
        ? `${Math.round(avatarArea.width)} × ${Math.round(avatarArea.height)} at ${Math.round(avatarArea.x)}, ${Math.round(avatarArea.y)}`
        : 'none yet'}
    </p>
  </div>
</Story>

<Story name="Crop in the browser" asChild>
  <div class="max-w-md">
    <FormField label="Cover image" hint="The cropped image replaces the one you chose.">
      {#snippet children(control)}
        <ImageInput
          {...control}
          name="cover"
          crop={{ aspect: 16 / 9, straighten: true, output: 'blob', encode: { type: 'image/webp', maxSize: 1600 } }}
          bind:file={coverFile}
        />
      {/snippet}
    </FormField>
    <p class="text-base-content/70 mt-3 text-sm">
      File: {coverFile ? `${coverFile.name}, ${coverFile.type}, ${coverFile.size} bytes` : 'none yet'}
    </p>
  </div>
</Story>

<Story name="With a size cap" asChild>
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
