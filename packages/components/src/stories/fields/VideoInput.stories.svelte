<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import VideoInput from '../../lib/fields/VideoInput.svelte';

  const { Story } = defineMeta({
    title: 'Fields/VideoInput',
    component: VideoInput,
    parameters: {
      docs: {
        description: {
          component:
            'A `FileInput` plus the progress readout for an upload the CALLER performs. This component owns the selection and the progress UI; the transfer belongs to the app, because a resumable upload client is a real dependency and does not belong in a package every page imports.',
        },
      },
    },
  });
</script>

<script lang="ts">
  let progress = $state(0);
  let ticking: ReturnType<typeof setInterval> | undefined;

  const fakeUpload = () => {
    if (ticking !== undefined) clearInterval(ticking);
    progress = 1;
    ticking = setInterval(() => {
      progress = Math.min(100, progress + 7);
      if (progress >= 100 && ticking !== undefined) clearInterval(ticking);
    }, 200);
  };
</script>

<Story name="Selection and progress">
  <div class="max-w-md">
    <FormField label="Video" hint="The bar appears once the caller reports progress.">
      {#snippet children(control)}
        <VideoInput
          {...control}
          bind:progress
          progressLabel="Uploading the video"
          onSelect={fakeUpload}
        />
      {/snippet}
    </FormField>
    <p class="text-base-content/70 mt-3 text-sm">Progress: {progress}%</p>
  </div>
</Story>

<Story name="With a size cap">
  <div class="max-w-md">
    <FormField label="Video">
      {#snippet children(control)}
        <VideoInput
          {...control}
          maxBytes={5_000_000}
          tooLargeMessage="That video is larger than 5 MB."
        />
      {/snippet}
    </FormField>
  </div>
</Story>
