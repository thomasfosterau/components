<!--
  ImageInput — a `FileInput` that also measures the picture and previews it.

  It exists for one thing a server cannot do cheaply: read a file's INTRINSIC
  DIMENSIONS. `createImageBitmap` decodes it in the browser the moment it is
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

  ARIA contract: `FileInput`'s. The preview `<img>` is named by `previewAlt`,
  and the measured size is a `<figcaption>` rather than an `aria-label`,
  because it is information about the file that a sighted reader gets too.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import FileInput from './FileInput.svelte';
  import type { FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'files' | 'size'> {
    /** The chosen file. */
    file?: File | undefined;
    /** Measured intrinsic width, in pixels. */
    width?: number | undefined;
    /** Measured intrinsic height, in pixels. */
    height?: number | undefined;
    /** Alternative text for the local preview. */
    previewAlt?: string | undefined;
    accept?: string | undefined;
    maxBytes?: number | undefined;
    tooLargeMessage?: string | undefined;
    onSelect?: ((file: File | undefined) => void) | undefined;
    size?: FieldSize | undefined;
    invalid?: boolean | undefined;
    describedBy?: string | undefined;
  }

  let {
    file = $bindable(),
    width = $bindable(),
    height = $bindable(),
    previewAlt = 'Preview of the selected image',
    accept = 'image/jpeg,image/png,image/gif,image/webp,image/avif',
    name,
    class: className,
    ...rest
  }: Props = $props();

  let previewUrl = $state<string | undefined>();
  let measuring = $state(false);

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
      const bitmap = await createImageBitmap(chosen);
      width = bitmap.width;
      height = bitmap.height;
      bitmap.close();
    } catch {
      width = undefined;
      height = undefined;
    } finally {
      measuring = false;
    }
  };

  const select = (chosen: File | undefined): void => {
    if (chosen === undefined) {
      previewUrl = undefined;
      width = undefined;
      height = undefined;
      return;
    }
    previewUrl = URL.createObjectURL(chosen);
    void measure(chosen);
  };
</script>

<div class={['flex flex-col gap-2', className]}>
  <FileInput {...rest} {name} {accept} bind:file onSelect={select} />

  {#if previewUrl !== undefined}
    <figure>
      <!-- The caller's own file, not a served image, so a plain `<img>`. -->
      <img src={previewUrl} alt={previewAlt} class="rounded-box border-base-300 max-h-64 border" />
      <figcaption class="fieldset-label mt-1">
        {#if measuring}
          &nbsp;
        {:else if width !== undefined && height !== undefined}
          {width} × {height}
        {/if}
      </figcaption>
    </figure>
  {/if}

  <!-- The measured dimensions ride the same multipart body as the binary. -->
  {#if name !== undefined && width !== undefined}
    <input type="hidden" name="width" value={width} />
  {/if}
  {#if name !== undefined && height !== undefined}
    <input type="hidden" name="height" value={height} />
  {/if}
</div>
