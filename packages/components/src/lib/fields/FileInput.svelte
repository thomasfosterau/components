<!-- @component
A native file input in daisyUI `file-input` styling, with the chosen `File` bindable and a client-side size cap.
-->
<!--
  FileInput — a native `<input type="file">` in daisyUI `file-input` styling,
  with the chosen `File` exposed as a bindable prop and a client-side size cap.

  It does NOT upload anything. The transfer belongs to the caller — a form
  POST, a direct-to-storage PUT, a resumable client — and a component every
  page imports has no business carrying one. `ImageInput` and `VideoInput`
  build on this: the selection and the messaging are shared, the transfer is
  not.

  `maxBytes` is enforced here as well as on the server because a file rejected
  after the transfer is a uniquely expensive way to say no. An over-size file
  is cleared from the control rather than left sitting in it, so what the
  control shows and what `file` holds cannot disagree.

  ARIA contract: a native file input. `aria-invalid` is set when the field is
  invalid OR the chosen file was too large, and the too-large message is an
  `alert` region the input's `aria-describedby` also points at, so the reason
  is announced and is available again on focus.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import FieldErrors from './FieldErrors.svelte';
  import { fileInputSize, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'files' | 'size'> {
    /** The chosen file; `undefined` when the control is empty. */
    file?: File | undefined;
    /** `accept` attribute value. */
    accept?: string | undefined;
    /** Largest file to accept, in bytes. Omitted, there is no cap. */
    maxBytes?: number | undefined;
    /**
     * Shown when the chosen file exceeds `maxBytes`.
     * @defaultValue `'That file is too large.'`
     */
    tooLargeMessage?: string | undefined;
    /** Called with the accepted file, or `undefined` when the choice cleared it. */
    onSelect?: ((file: File | undefined) => void) | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** `FieldControl`: the field is in error — sets `aria-invalid` and the error style. */
    invalid?: boolean | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the visible label's id. Not used — this control is
     * labelable, so the `FormField`'s `<label for>` already names it; taken
     * here so a spread `FieldControl` does not leak it as an attribute.
     */
    labelId?: string | undefined;
  }

  let {
    file = $bindable(),
    accept,
    maxBytes,
    tooLargeMessage = 'That file is too large.',
    onSelect,
    size = 'md',
    invalid = false,
    describedBy = '',
    labelId: _labelId,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const tooLargeId = `${uid}-too-large`;

  let tooLarge = $state(false);

  const described = $derived(
    [describedBy, tooLarge ? tooLargeId : ''].filter((part) => part !== '').join(' '),
  );

  const choose = (control: HTMLInputElement): void => {
    const chosen = control.files?.[0];
    tooLarge = false;
    if (chosen === undefined) {
      file = undefined;
      onSelect?.(undefined);
      return;
    }
    if (maxBytes !== undefined && chosen.size > maxBytes) {
      tooLarge = true;
      // Clear the control too: leaving the name of a file that was refused
      // showing in the field is how someone submits and wonders what happened.
      control.value = '';
      file = undefined;
      onSelect?.(undefined);
      return;
    }
    file = chosen;
    onSelect?.(chosen);
  };
</script>

<input
  {...rest}
  type="file"
  {accept}
  onchange={(event) => choose(event.currentTarget)}
  aria-invalid={invalid || tooLarge ? 'true' : undefined}
  aria-describedby={described === '' ? undefined : described}
  class={[
    'file-input w-full',
    fileInputSize[size],
    (invalid || tooLarge) && 'file-input-error',
    className,
  ]}
/>
<FieldErrors errors={tooLarge ? [tooLargeMessage] : []} id={tooLargeId} />
