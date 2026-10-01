<!-- @component
A `FileInput` plus the progress readout for an upload the caller performs.
-->
<!--
  VideoInput — a `FileInput` plus the progress readout for an upload the
  CALLER performs.

  The division is deliberate and is the same one `FileInput` states: this owns
  the SELECTION and the PROGRESS UI, the caller owns the transfer. It receives
  the chosen file through `onSelect`, drives the upload however it likes —
  resumable, direct-to-storage, whatever the provider needs — and reports back
  by writing `progress`. A tus or S3 client is a real dependency and belongs
  in the app, not in a package every page imports.

  ARIA contract: `FileInput`'s, plus a native `<progress>` named by
  `progressLabel`. The bar appears only while a transfer is actually in
  flight (0 < progress < 100), so a reader is not handed a permanently
  stalled-looking control.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import FileInput from './FileInput.svelte';
  import type { FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'files' | 'size'> {
    /** The chosen file. */
    file?: File | undefined;
    /**
     * Transfer progress, 0–100. The caller writes this as its upload advances.
     * @defaultValue `0`
     */
    progress?: number;
    /**
     * Accessible name of the progress bar.
     * @defaultValue `'Upload progress'`
     */
    progressLabel?: string | undefined;
    /**
     * The `accept` filter passed to the file input.
     * @defaultValue `'video/*'`
     */
    accept?: string | undefined;
    /** Largest accepted file, in bytes; a larger file is rejected with `tooLargeMessage`. */
    maxBytes?: number | undefined;
    /**
     * Shown when the chosen file exceeds `maxBytes`.
     * @defaultValue `FileInput`'s
     */
    tooLargeMessage?: string | undefined;
    /** Called with the accepted file — the caller starts the transfer here. */
    onSelect?: ((file: File | undefined) => void) | undefined;
    /** daisyUI size step. */
    size?: FieldSize | undefined;
    /** `FieldControl`: the field is in error — sets `aria-invalid` and the error style. */
    invalid?: boolean | undefined;
    /** `FieldControl`: space-separated ids for `aria-describedby`. */
    describedBy?: string | undefined;
  }

  let {
    file = $bindable(),
    progress = $bindable(0),
    progressLabel = 'Upload progress',
    accept = 'video/*',
    onSelect,
    class: className,
    ...rest
  }: Props = $props();

  const uploading = $derived(file !== undefined && progress > 0 && progress < 100);

  const select = (chosen: File | undefined): void => {
    progress = 0;
    onSelect?.(chosen);
  };
</script>

<div class={['flex flex-col gap-2', className]}>
  <FileInput {...rest} {accept} bind:file onSelect={select} />
  {#if uploading}
    <progress class="progress progress-primary w-full" value={progress} max="100" aria-label={progressLabel}
    ></progress>
  {/if}
</div>
