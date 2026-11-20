<script lang="ts">
  import ImageCropper from '../../../src/lib/fields/ImageCropper.svelte';
  import type { CropArea } from '../../../src/lib/fields/crop.ts';
  import type { CropExportOptions } from '../../../src/lib/fields/crop-export.ts';

  interface Props {
    src: Blob;
    aspect?: number | undefined;
    straighten?: boolean | undefined;
  }

  let { src, aspect = 1, straighten = false }: Props = $props();

  let area: CropArea | undefined = $state();
  let api: { toBlob(options?: CropExportOptions): Promise<Blob> } | undefined = $state();
  let exported = $state('');

  const round = (n: number) => Math.round(n);

  const exportWebp = async () => {
    if (!api) return;
    const blob = await api.toBlob({ type: 'image/webp', maxSize: 256 });
    const bitmap = await createImageBitmap(blob);
    exported = `${blob.type} ${bitmap.width}x${bitmap.height}`;
  };
</script>

<div style="width: 300px;">
  <ImageCropper {src} {aspect} {straighten} bind:area bind:api />
</div>
<output data-testid="area"
  >{#if area}{round(area.x)},{round(area.y)},{round(area.width)},{round(area.height)},{area.rotation}{/if}</output
>
<button type="button" onclick={exportWebp}>Export</button>
<output data-testid="exported">{exported}</output>
