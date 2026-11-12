<!-- @component
A modal that asks for one short text value — rename, a new name, type-to-confirm — validated before it can be confirmed, by callback or by a progressive-enhancement POST.
-->
<!--
  PromptDialog — `Dialog`, one `FormField` + `TextInput`, and Cancel /
  Confirm: the rename / new-folder / "type the name to delete it" modal apps
  otherwise rebuild each time.

  The whole body is one `<form>` (field and buttons both inside it), so Enter
  in the field submits through the platform's implicit submission. In
  callback mode (`onConfirm`) the submit is prevented and the callback runs;
  in form mode (`form`) the browser POSTs the field under `form.name` to
  `form.action`, with the app's `enhance` attached when it has one — the same
  two modes as `ConfirmDialog`.

  ARIA and keyboard contract:
  - Everything `Dialog` gives (APG modal dialog: `aria-modal`, the title as
    its name, focus trap, Escape, focus return). Initial focus goes to the
    FIELD, with its value selected so typing replaces it.
  - Confirm is `disabled` while the value is invalid or a validation is
    pending, and the field then carries `aria-invalid` and the messages in its
    `aria-describedby`, so a screen-reader user hears why Confirm does nothing. A
    pending async validation marks the form `aria-busy`.
  - In flight, Confirm shows `loading` (`aria-busy`, its name unchanged);
    the field and Cancel stay usable. Closing — Cancel, Escape, the corner
    button — aborts the `AbortSignal` handed to `onConfirm` and `validate`.
  - `requireMatch` (type-to-confirm): Confirm enables only when the value
    equals it EXACTLY — no trimming, case-sensitive — and the field is
    described by a line naming the text to type in `<code>`.

  A rejection with an `Error` shows that error's message under the field;
  anything else shows `failureMessage`. The dialog stays open on failure.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import FormField from '../fields/FormField.svelte';
  import TextInput from '../fields/TextInput.svelte';
  import Button from '../ui/Button.svelte';
  import type { Tone } from '../ui/tones.ts';
  import Dialog from './Dialog.svelte';
  import type { DialogSize } from './sizes.ts';

  /** Form mode: where the value is posted, and under what name. */
  interface PromptForm {
    /** The form's `action` — a SvelteKit named action (`?/rename`) or a path. */
    readonly action: string;
    /** The field's `name`. */
    readonly name: string;
    /** Extra fields to post, as hidden inputs inside the form. */
    readonly fields?: Readonly<Record<string, string>> | undefined;
    /** The app's own `use:enhance`, applied to the `<form>`. */
    readonly enhance?: ((form: HTMLFormElement) => void | (() => void)) | undefined;
  }

  /** The text-input attributes worth passing through. */
  type PromptInputProps = Pick<
    HTMLInputAttributes,
    'autocomplete' | 'inputmode' | 'maxlength' | 'minlength' | 'pattern' | 'spellcheck'
  > & {
    readonly type?: 'text' | 'email' | 'url' | 'tel' | 'search' | undefined;
  };

  interface Props {
    /** Whether the dialog is shown. Bindable. */
    open?: boolean | undefined;
    /** Heading — the dialog's accessible name. */
    title: string;
    /** A line under the heading — the dialog's description. */
    description?: string | undefined;
    /** The field's label. */
    label: string;
    /**
     * The value the field opens with, selected so typing replaces it.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /** The field's placeholder. */
    placeholder?: string | undefined;
    /** A hint under the field. */
    hint?: string | undefined;
    /** Attributes for the text input (`type`, `autocomplete`, `maxlength`, …). */
    inputProps?: PromptInputProps | undefined;
    /** Messages for an invalid value, empty when it is valid; may be async. Debounced while typing. */
    validate?:
      | ((value: string, signal: AbortSignal) => readonly string[] | Promise<readonly string[]>)
      | undefined;
    /**
     * Milliseconds of quiet before `validate` runs again.
     * @defaultValue `250`
     */
    validateDelay?: number | undefined;
    /** Type-to-confirm: Confirm enables only when the value equals this exactly. */
    requireMatch?: string | undefined;
    /**
     * The line before the text to type, when `requireMatch` is set.
     * @defaultValue `'To confirm, type'`
     */
    requireMatchLabel?: string | undefined;
    /** Callback mode: resolve to close; a rejection shows under the field. */
    onConfirm?: ((value: string, signal: AbortSignal) => void | Promise<void>) | undefined;
    /** Form mode: a progressive-enhancement POST of the value. */
    form?: PromptForm | undefined;
    /**
     * Text of the confirm button.
     * @defaultValue `'OK'`
     */
    confirmLabel?: string | undefined;
    /**
     * Text of the cancel button.
     * @defaultValue `'Cancel'`
     */
    cancelLabel?: string | undefined;
    /**
     * Accessible name of the corner close button.
     * @defaultValue `'Close'`
     */
    closeLabel?: string | undefined;
    /**
     * Shown when `onConfirm` rejects with something that is not an `Error`.
     * @defaultValue `'That didn’t work. Try again.'`
     */
    failureMessage?: string | undefined;
    /**
     * Colour of the confirm button; `'error'` for a destructive type-to-confirm.
     * @defaultValue `'primary'`
     */
    tone?: Tone | undefined;
    /**
     * Width of the dialog.
     * @defaultValue `'sm'`
     */
    size?: DialogSize | undefined;
    /** Extra classes, merged last. */
    class?: string | undefined;
    /** The opening control — the caller's own element, spreading `props`. */
    trigger?: Snippet<[{ props: Record<string, unknown> }]> | undefined;
  }

  let {
    open = $bindable(false),
    title,
    description,
    label,
    value = '',
    placeholder,
    hint,
    inputProps,
    validate,
    validateDelay = 250,
    requireMatch,
    requireMatchLabel = 'To confirm, type',
    onConfirm,
    form,
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    closeLabel = 'Close',
    failureMessage = 'That didn’t work. Try again.',
    tone = 'primary',
    size = 'sm',
    class: className,
    trigger,
  }: Props = $props();

  const baseId = $props.id();
  const matchId = `${baseId}-match`;
  const fieldId = `${baseId}-field`;

  let current = $state('');
  let messages = $state<readonly string[]>([]);
  let validating = $state(false);
  let pending = $state(false);
  let failure = $state<string | undefined>(undefined);

  let confirmController: AbortController | undefined;
  let validateController: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const matches = $derived(requireMatch === undefined || current === requireMatch);
  const errors = $derived(failure === undefined ? messages : [...messages, failure]);
  const canConfirm = $derived(matches && messages.length === 0 && !validating && !pending);

  const stopValidation = (): void => {
    clearTimeout(timer);
    validateController?.abort();
    validateController = undefined;
    validating = false;
  };

  const runValidation = async (text: string): Promise<void> => {
    if (validate === undefined) return;
    validateController?.abort();
    const controller = new AbortController();
    validateController = controller;
    validating = true;
    try {
      const result = await validate(text, controller.signal);
      if (!controller.signal.aborted) messages = result;
    } finally {
      if (validateController === controller) validating = false;
    }
  };

  const scheduleValidation = (text: string): void => {
    if (validate === undefined) return;
    clearTimeout(timer);
    validating = true;
    timer = setTimeout(() => {
      void runValidation(text);
    }, validateDelay);
  };

  // Each opening starts from the caller's value; each closing abandons
  // whatever was in flight, so a late result never lands on a closed dialog.
  $effect(() => {
    if (open) {
      current = value;
      messages = [];
      failure = undefined;
      if (validate !== undefined) void runValidation(value);
      return;
    }
    stopValidation();
    confirmController?.abort();
    confirmController = undefined;
    pending = false;
  });

  const oninput = (): void => {
    failure = undefined;
    scheduleValidation(current);
  };

  const onsubmit = async (event: SubmitEvent): Promise<void> => {
    if (!canConfirm) {
      event.preventDefault();
      return;
    }
    if (form !== undefined) return;
    event.preventDefault();
    if (onConfirm === undefined) {
      open = false;
      return;
    }
    const controller = new AbortController();
    confirmController = controller;
    pending = true;
    failure = undefined;
    try {
      await onConfirm(current, controller.signal);
      if (!controller.signal.aborted) open = false;
    } catch (error) {
      if (!controller.signal.aborted) {
        failure = error instanceof Error ? error.message : failureMessage;
      }
    } finally {
      if (confirmController === controller) pending = false;
    }
  };

  /** The app's `enhance`, as an attachment so omitting it is a no-op. */
  const enhanceForm = (node: HTMLFormElement): void | (() => void) => form?.enhance?.(node);

  /** Focus the field on open, with its value selected so typing replaces it. */
  const initialFocus = (): HTMLElement | undefined => {
    const field = document.getElementById(fieldId);
    if (!(field instanceof HTMLInputElement)) return undefined;
    field.select();
    return field;
  };
</script>

<Dialog
  bind:open
  {title}
  {description}
  {closeLabel}
  {size}
  class={className}
  {trigger}
  {initialFocus}
>
  <form
    method={form === undefined ? undefined : 'POST'}
    action={form?.action}
    aria-busy={validating ? 'true' : undefined}
    class="space-y-4"
    {onsubmit}
    {@attach enhanceForm}
  >
    {#each Object.entries(form?.fields ?? {}) as [fieldName, fieldValue] (fieldName)}
      <input type="hidden" name={fieldName} value={fieldValue} />
    {/each}
    {#if requireMatch !== undefined}
      <p id={matchId} class="text-sm">{requireMatchLabel} <code>{requireMatch}</code></p>
    {/if}
    <FormField id={fieldId} {label} {hint} {errors}>
      {#snippet children(control)}
        <TextInput
          {...control}
          {...inputProps}
          describedBy={[control.describedBy, requireMatch === undefined ? '' : matchId]
            .filter((part) => part !== '')
            .join(' ')}
          name={form?.name}
          {placeholder}
          bind:value={current}
          {oninput}
        />
      {/snippet}
    </FormField>
    <div class="modal-action mt-0">
      <Button
        variant="ghost"
        onclick={() => {
          open = false;
        }}
      >
        {cancelLabel}
      </Button>
      <Button type="submit" {tone} disabled={!canConfirm && !pending} loading={pending}>
        {confirmLabel}
      </Button>
    </div>
  </form>
</Dialog>
