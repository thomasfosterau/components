<!-- @component
A sticky bar that appears as soon as a form is dirty, offering Save and Discard, and announces itself and the save politely.
-->
<!--
  SaveBar — the contextual save bar: it renders nothing while `dirty` is
  false, and from the first edit until the changes are saved or discarded it
  sits at the top or bottom of its scroll container with "Unsaved changes",
  Discard and Save.

  Save works two ways. With `form`, it is a real `type="submit"` button
  associated to that form by the `form` attribute, so it submits a form it is
  not inside and works without scripting. With `onSave`, it runs the callback
  (aborted if the bar goes away mid-flight) and shows itself busy. With
  neither, it submits the form it sits inside (what `EntityForm` does).
  Discard asks first (`ConfirmDialog`) unless `confirmDiscard` is false, then
  calls `onDiscard`.

  ARIA contract: the bar is a `region` named by its message. It never takes
  focus — the reader is mid-edit — and a focused field stays focused through
  Save. A separate, always-mounted `role="status"` region (polite) says the
  message once when the bar appears, not on every keystroke, and says
  `savedLabel` when the bar goes away because the changes were saved (a
  discard says nothing: the reader just chose it). The status region has to
  exist before its text changes, which is why it is outside the `{#if}`.

  Layout: `sticky`, so the bar takes its own room in the flow instead of
  covering the last field. The bar can still cover a focused field when the
  page is scrolled, so give the scrolling element a `scroll-padding-block`
  at least as tall as the bar (the README shows it).
-->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import ConfirmDialog from '../feedback/ConfirmDialog.svelte';
  import Button from '../ui/Button.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Show the bar when true. */
    dirty: boolean;
    /**
     * The bar's text and its accessible name.
     * @defaultValue `'Unsaved changes'`
     */
    message?: string | undefined;
    /** The `id` of the form Save submits, even from outside it. Omitted, Save submits the form it sits in. */
    form?: string | undefined;
    /** Run on Save instead of submitting a form; the signal aborts when the bar is destroyed. */
    onSave?: ((signal: AbortSignal) => Promise<void>) | undefined;
    /** Called when the reader discards (after confirming, if `confirmDiscard`). */
    onDiscard?: (() => void) | undefined;
    /**
     * Text of the Save button.
     * @defaultValue `'Save'`
     */
    saveLabel?: string | undefined;
    /**
     * Text of the Discard button.
     * @defaultValue `'Discard'`
     */
    discardLabel?: string | undefined;
    /**
     * Ask before discarding.
     * @defaultValue `true`
     */
    confirmDiscard?: boolean | undefined;
    /**
     * Heading of the discard confirmation.
     * @defaultValue `'Discard changes?'`
     */
    discardTitle?: string | undefined;
    /**
     * Body of the discard confirmation.
     * @defaultValue `'Changes you made will be lost.'`
     */
    discardDescription?: string | undefined;
    /**
     * Cancel button of the discard confirmation.
     * @defaultValue `'Keep editing'`
     */
    keepLabel?: string | undefined;
    /**
     * Announced politely when the bar goes away because the changes were saved.
     * @defaultValue `'Saved'`
     */
    savedLabel?: string | undefined;
    /** A save is in flight (a form submitting): Save is busy and Discard is disabled. */
    saving?: boolean | undefined;
    /**
     * Which edge of its container the bar sticks to.
     * @defaultValue `'bottom'`
     */
    position?: 'top' | 'bottom' | undefined;
  }

  let {
    dirty,
    message = 'Unsaved changes',
    form,
    onSave,
    onDiscard,
    saveLabel = 'Save',
    discardLabel = 'Discard',
    confirmDiscard = true,
    discardTitle = 'Discard changes?',
    discardDescription = 'Changes you made will be lost.',
    keepLabel = 'Keep editing',
    savedLabel = 'Saved',
    saving = false,
    position = 'bottom',
    class: className,
    ...rest
  }: Props = $props();

  const positionClasses: Record<NonNullable<Props['position']>, string> = {
    top: 'top-0 border-b',
    bottom: 'bottom-0 border-t',
  };

  const messageId = $props.id();

  let announcement = $state('');
  let confirming = $state(false);
  let working = $state(false);
  let wasDirty = false;
  let discarded = false;
  let controller: AbortController | undefined;

  $effect(() => {
    if (dirty && !wasDirty) {
      announcement = message;
    } else if (!dirty && wasDirty) {
      announcement = discarded ? '' : savedLabel;
    }
    if (dirty) discarded = false;
    wasDirty = dirty;
  });

  onDestroy(() => {
    controller?.abort();
  });

  const discard = (): void => {
    discarded = true;
    onDiscard?.();
  };

  const requestDiscard = (): void => {
    if (confirmDiscard) confirming = true;
    else discard();
  };

  const save = async (): Promise<void> => {
    if (onSave === undefined) return;
    controller?.abort();
    const current = new AbortController();
    controller = current;
    working = true;
    try {
      await onSave(current.signal);
    } finally {
      if (controller === current) working = false;
    }
  };

  const busy = $derived(saving || working);
</script>

<div role="status" class="sr-only">{announcement}</div>

{#if dirty}
  <div
    {...rest}
    role="region"
    aria-labelledby={messageId}
    class={[
      'bg-base-200 border-base-300 sticky z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-3',
      positionClasses[position],
      className,
    ]}
  >
    <p id={messageId} class="text-sm font-medium">{message}</p>
    <div class="flex items-center gap-2">
      <Button variant="ghost" disabled={busy} onclick={requestDiscard}>{discardLabel}</Button>
      <Button
        tone="primary"
        type={onSave === undefined ? 'submit' : 'button'}
        {form}
        loading={busy}
        onclick={onSave === undefined ? undefined : save}
      >
        {saveLabel}
      </Button>
    </div>
  </div>
{/if}

<ConfirmDialog
  bind:open={confirming}
  title={discardTitle}
  description={discardDescription}
  confirmLabel={discardLabel}
  cancelLabel={keepLabel}
  onConfirm={async () => {
    discard();
  }}
/>
