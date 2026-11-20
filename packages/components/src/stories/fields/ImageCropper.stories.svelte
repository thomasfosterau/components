<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ImageCropper from '../../lib/fields/ImageCropper.svelte';
  import ImageCropperDemo from './ImageCropperDemo.svelte';

  const { Story } = defineMeta({
    title: 'Fields/ImageCropper',
    component: ImageCropper,
    parameters: {
      docs: {
        description: {
          component:
            'A fixed frame over a movable image. Drag to pan, scroll or pinch to zoom; or focus the frame and use the arrow keys, + and −, and Home. The crop is bound as `area`, in source pixels.',
        },
      },
    },
  });
</script>

<Story name="Round avatar" asChild>
  <ImageCropperDemo round />
</Story>

<Story name="Wide cover" asChild>
  <ImageCropperDemo aspect={16 / 9} />
</Story>

<Story name="Straighten" asChild>
  <ImageCropperDemo aspect={4 / 3} straighten />
</Story>
