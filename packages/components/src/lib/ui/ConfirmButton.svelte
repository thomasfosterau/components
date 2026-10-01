<!-- @component
A destructive action behind a two-step inline confirmation.
-->
<!--
  ConfirmButton — a destructive action behind a two-step inline confirm.

  Inline rather than a dialog, deliberately: the confirmation replaces the
  button in place, so nothing is torn out of the reading order, focus is not
  trapped, and the page behind it does not need an overlay. Use
  `ConfirmDialog` instead when the confirmation itself needs to carry content
  (a form, a list of what will be destroyed).

  ARIA contract: the failure surface is an `Alert` with `live="assertive"` —
  the reader pressed a button and nothing visible happened, so the reason has
  to interrupt. Both buttons are `disabled` while the action is in flight, and
  the confirm button swaps its text to `pendingLabel` rather than emptying
  itself, so its accessible name never disappears mid-press.

  `action` is a plain promise-returning prop — no Effect in this library. A
  rejection with an `Error` shows that error's message (the caller's own
  wording, usually from the server); anything else shows `failureMessage`.
  On success, `redirectTo` navigates through the components context, so an
  app gets client-side routing and this component stays ignorant of it.
-->
<script lang="ts">
  import { getComponentsContext } from '../context.svelte.ts';
  import Alert from './Alert.svelte';
  import Button from './Button.svelte';
  import type { Tone } from './tones.ts';

  interface Props {
    /** The destructive action itself. */
    action: () => Promise<unknown>;
    /**
     * The resting button's text.
     * @defaultValue `'Delete'`
     */
    idleLabel?: string | undefined;
    /**
     * The confirm button's text.
     * @defaultValue `'Confirm'`
     */
    confirmLabel?: string | undefined;
    /**
     * The cancel button's text.
     * @defaultValue `'Cancel'`
     */
    cancelLabel?: string | undefined;
    /**
     * The confirm button's text while the action is in flight.
     * @defaultValue `'Working…'`
     */
    pendingLabel?: string | undefined;
    /**
     * The question shown beside the confirm and cancel buttons.
     * @defaultValue `'Are you sure? This cannot be undone.'`
     */
    confirmMessage?: string | undefined;
    /**
     * Shown when the action rejects with something that is not an `Error`.
     * @defaultValue `'That didn’t work. Try again.'`
     */
    failureMessage?: string | undefined;
    /**
     * Tone of the idle and confirm buttons.
     * @defaultValue `'error'`
     */
    tone?: Tone | undefined;
    /** Navigated to through the components context once `action` resolves. */
    redirectTo?: string | undefined;
    /** Extra classes, merged last. */
    class?: string | undefined;
  }

  let {
    action,
    idleLabel = 'Delete',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    pendingLabel = 'Working…',
    confirmMessage = 'Are you sure? This cannot be undone.',
    failureMessage = 'That didn’t work. Try again.',
    tone = 'error',
    redirectTo,
    class: className,
  }: Props = $props();

  const context = getComponentsContext();

  let confirming = $state(false);
  let pending = $state(false);
  let errorMessage = $state<string | undefined>(undefined);

  const beginConfirmation = (): void => {
    errorMessage = undefined;
    confirming = true;
  };

  const cancelConfirmation = (): void => {
    if (pending) return;
    errorMessage = undefined;
    confirming = false;
  };

  const confirmAction = async (): Promise<void> => {
    pending = true;
    errorMessage = undefined;
    try {
      await action();
      confirming = false;
      if (redirectTo !== undefined) await context.navigate(context.href(redirectTo));
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : failureMessage;
    } finally {
      pending = false;
    }
  };
</script>

<div class={['space-y-2', className]}>
  {#if confirming}
    <div class="flex flex-wrap items-center gap-2">
      <p class="text-sm">{confirmMessage}</p>
      <Button {tone} disabled={pending} loading={pending} onclick={confirmAction}>
        {pending ? pendingLabel : confirmLabel}
      </Button>
      <Button variant="ghost" disabled={pending} onclick={cancelConfirmation}>
        {cancelLabel}
      </Button>
    </div>
  {:else}
    <Button {tone} onclick={beginConfirmation}>{idleLabel}</Button>
  {/if}

  {#if errorMessage !== undefined}
    <Alert tone="error" live="assertive">{errorMessage}</Alert>
  {/if}
</div>
