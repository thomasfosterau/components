<!-- @component
A `FileInput` that also measures the chosen image and previews it.
-->
<!--
  ImageInput — a `FileInput` that also measures the picture and previews it.

  It exists for one thing a server cannot do cheaply: read a file's INTRINSIC
  DIMENSIONS. `createImageBitmap` (via `media/image-dimensions.ts`) decodes it in the browser the moment it is
  chosen, so the form has `width` / `height` to submit alongside the binary and
  the page that later renders the image can reserve its box on first paint
  instead of reflowing when it loads.

  The preview is an object URL, so the file never leaves the browser until the
  form is submitted. The URL is revoked as soon as it is replaced and again on
  teardown — an un-revoked object URL pins the whole file in memory for the
  life of the document.

  A decode failure means the browser could not read the file as an image; the
  server's own media-type gate will refuse it too, so the dimensions are left
  unset rather than blocking the submission.

  With `crop`, choosing a file opens `ImageCropDialog`; Cancel keeps the
  uncropped file, and focus returns to the file input either way.

  ARIA contract: `FileInput`'s. The preview `<img>` is named by `previewAlt`,
  and the measured size is a `<figcaption>` rather than an `aria-label`,
  because it is information about the file that a sighted reader gets too.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import Button from '../ui/Button.svelte';
  import { imageDimensions } from '../media/image-dimensions.ts';
  import type { CropArea } from './crop.ts';
  import type { CropExportOptions } from './crop-export.ts';
  import FileInput from './FileInput.svelte';
  import type { FieldSize } from './field-types.ts';
  import ImageCropDialog from './ImageCropDialog.svelte';

  /** How `ImageInput` frames a chosen image before it is kept. */
  export interface ImageCropOptions {
    /**
     * The frame's aspect ratio, width over height.
     * @defaultValue `1`
     */
    readonly aspect?: number | undefined;
    /** Show a circular mask, for avatars. The crop is still a rectangle. */
    readonly round?: boolean | undefined;
    /** Offer a ±45° straighten slider. */
    readonly straighten?: boolean | undefined;
    /**
     * `'area'` keeps the original file and binds `area` for the server to crop;
     * `'blob'` replaces `file` with the cropped image.
     * @defaultValue `'area'`
     */
    readonly output?: 'area' | 'blob' | undefined;
    /** How to encode the cropped image (`'blob'`) and the preview. The type defaults to the chosen file's. */
    readonly encode?: CropExportOptions | undefined;
  }

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'files' | 'size'> {
    /** The chosen file. */
    file?: File | undefined;
    /** Measured intrinsic width, in pixels. */
    width?: number | undefined;
    /** Measured intrinsic height, in pixels. */
    height?: number | undefined;
    /**
     * Alternative text for the local preview.
     * @defaultValue `'Preview of the selected image'`
     */
    previewAlt?: string | undefined;
    /**
     * The `accept` filter passed to the file input.
     * @defaultValue `'image/jpeg,image/png,image/gif,image/webp,image/avif'`
     */
    accept?: string | undefined;
    /** Largest accepted file, in bytes; a larger file is rejected with `tooLargeMessage`. */
    maxBytes?: number | undefined;
    /**
     * Shown when the chosen file exceeds `maxBytes`.
     * @defaultValue `'That file is too large. The limit is <maxBytes>.'` (from `FileInput`)
     */
    tooLargeMessage?: string | undefined;
    /** Frame the chosen image in a cropping dialog before it is kept. */
    crop?: ImageCropOptions | undefined;
    /**
     * The applied crop, in source pixels after `rotation`, with `output: 'area'`.
     * Bindable; posted as `cropX`, `cropY`, `cropWidth`, `cropHeight`, `cropRotation`
     * and `cropStraighten` once `name` is set.
     */
    area?: CropArea | undefined;
    /**
     * The cropping dialog's title.
     * @defaultValue `'Crop image'`
     */
    cropTitle?: string | undefined;
    /**
     * The button that applies the crop.
     * @defaultValue `'Apply'`
     */
    applyLabel?: string | undefined;
    /**
     * The button that closes the dialog and keeps the uncropped image.
     * @defaultValue `'Cancel'`
     */
    cancelLabel?: string | undefined;
    /**
     * The button under the preview that reopens the crop.
     * @defaultValue `'Edit crop'`
     */
    editCropLabel?: string | undefined;
    /** Called with the accepted file, or `undefined` when the selection is cleared. */
    onSelect?: ((file: File | undefined) => void) | undefined;
    /** daisyUI size step. */
    size?: FieldSize | undefined;
    /** `FieldControl`: the field is in error — sets `aria-invalid` and the error style. */
    invalid?: boolean | undefined;
    /** `FieldControl`: space-separated ids for `aria-describedby`. */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the visible label's id. Not used — the file input is
     * labelable, so `<label for>` names it; passed through to `FileInput`,
     * which drops it.
     */
    labelId?: string | undefined;
  }

  let {
    file = $bindable(),
    width = $bindable(),
    height = $bindable(),
    previewAlt = 'Preview of the selected image',
    accept = 'image/jpeg,image/png,image/gif,image/webp,image/avif',
    crop,
    area = $bindable(),
    cropTitle = 'Crop image',
    applyLabel = 'Apply',
    cancelLabel = 'Cancel',
    editCropLabel = 'Edit crop',
    onSelect,
    name,
    class: className,
    ...rest
  }: Props = $props();

  let previewUrl = $state<string | undefined>();
  let measuring = $state(false);
  let root = $state<HTMLDivElement>();
  /** The file as chosen, before any crop: what the dialog frames. */
  let original = $state<File | undefined>();
  let cropping = $state(false);
  /** The last applied crop, which the dialog reopens. */
  let applied = $state<CropArea | undefined>();

  const fileControl = (): HTMLInputElement | null | undefined =>
    root?.querySelector<HTMLInputElement>('input[type="file"]');

  const areaFields = $derived(
    name !== undefined && area !== undefined
      ? {
          cropX: area.x,
          cropY: area.y,
          cropWidth: area.width,
          cropHeight: area.height,
          cropRotation: area.rotation,
          cropStraighten: area.straighten,
        }
      : {},
  );
  const caption = $derived(
    crop?.output !== 'blob' && area !== undefined
      ? { width: Math.round(area.width), height: Math.round(area.height) }
      : { width, height },
  );

  // Revoke the PREVIOUS url whenever this one changes, and the last one when
  // the component goes away. Reading `previewUrl` inside the effect is what
  // makes the cleanup run on every change rather than only on teardown.
  $effect(() => {
    const url = previewUrl;
    return () => {
      if (url !== undefined) URL.revokeObjectURL(url);
    };
  });

  const measure = async (chosen: File): Promise<void> => {
    measuring = true;
    try {
      ({ width, height } = await imageDimensions(chosen));
    } catch {
      width = undefined;
      height = undefined;
    } finally {
      measuring = false;
    }
  };

  const select = (chosen: File | undefined): void => {
    original = chosen;
    applied = undefined;
    area = undefined;
    onSelect?.(chosen);
    if (chosen === undefined) {
      previewUrl = undefined;
      width = undefined;
      height = undefined;
      return;
    }
    previewUrl = URL.createObjectURL(chosen);
    void measure(chosen);
    cropping = crop !== undefined;
  };

  const applyCrop = (chosen: CropArea, blob: Blob): void => {
    applied = chosen;
    previewUrl = URL.createObjectURL(blob);
    if (crop?.output !== 'blob' || original === undefined) {
      area = chosen;
      return;
    }
    const cropped = new File([blob], original.name, { type: blob.type });
    file = cropped;
    // Put the cropped file on the input too, so a native form submits it.
    const control = fileControl();
    if (control) {
      const transfer = new DataTransfer();
      transfer.items.add(cropped);
      control.files = transfer.files;
    }
    void measure(cropped);
  };
</script>

<div bind:this={root} class={['flex flex-col gap-2', className]}>
  <FileInput {...rest} {name} {accept} bind:file onSelect={select} />

  {#if previewUrl !== undefined}
    <figure>
      <!-- The caller's own file, not a served image, so a plain `<img>`. -->
      <img src={previewUrl} alt={previewAlt} class="rounded-box border-base-300 max-h-64 border" />
      <figcaption class="fieldset-label mt-1">
        {#if measuring}
          &nbsp;
        {:else if caption.width !== undefined && caption.height !== undefined}
          {caption.width} × {caption.height}
        {/if}
      </figcaption>
    </figure>
    {#if crop !== undefined && original !== undefined}
      <Button size="sm" variant="outline" class="self-start" onclick={() => (cropping = true)}>
        {editCropLabel}
      </Button>
    {/if}
  {/if}

  {#if crop !== undefined && original !== undefined}
    <ImageCropDialog
      bind:open={cropping}
      src={original}
      area={applied}
      aspect={crop.aspect}
      round={crop.round}
      straighten={crop.straighten}
      encode={{ type: original.type, ...crop.encode }}
      title={cropTitle}
      {applyLabel}
      {cancelLabel}
      finalFocus={fileControl}
      onApply={applyCrop}
    />
  {/if}

  {#each Object.entries(areaFields) as [field, value] (field)}
    <input type="hidden" name={field} {value} />
  {/each}

  <!-- The measured dimensions ride the same multipart body as the binary. -->
  {#if name !== undefined && width !== undefined}
    <input type="hidden" name="width" value={width} />
  {/if}
  {#if name !== undefined && height !== undefined}
    <input type="hidden" name="height" value={height} />
  {/if}
</div>
