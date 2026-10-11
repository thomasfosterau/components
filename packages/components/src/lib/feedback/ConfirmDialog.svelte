<!-- @component
A destructive action behind a modal confirmation, run either as a callback (`onConfirm`) or as a progressive-enhancement POST (`form`).
-->
<!--
  ConfirmDialog — a destructive action behind a modal confirmation, in the two
  shapes the app repos actually needed.

  **Callback mode** (`onConfirm`) is the client-side one: the promise runs,
  the confirm button goes busy, a rejection is shown inside the still-open
  dialog so the reader can retry or cancel, and a resolution closes it and
  optionally navigates through the components context.

  **Form mode** (`form`) is the progressive-enhancement one: the confirm
  button is a real `type="submit"` inside a real `<form method="POST">`, so
  the action posts and the server redirects even with scripting off. The SvelteKit `enhance` action is passed IN by the
  app (`enhance: (node) => enhance(node)`); importing `$app/forms` here would
  tie this package to SvelteKit. It is applied as an attachment, so a caller
  that omits it simply gets the unenhanced form.

  Pass exactly one of the two. With neither, the confirm button does nothing
  — there is no action to take.

  ARIA contract: `Dialog`'s, plus a failure surfaced as an `Alert` with
  `live="assertive"` inside the dialog (the reader pressed confirm and
  nothing visible happened, so the reason has to interrupt). Both buttons are
  `disabled` while the callback is in flight and the confirm button swaps its
  text to `pendingLabel` rather than emptying itself, so its accessible name
  never disappears mid-press.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getComponentsContext } from '../context.svelte.ts';
  import Alert from '../ui/Alert.svelte';
  import Button from '../ui/Button.svelte';
  import type { Tone } from '../ui/tones.ts';
  import Dialog from './Dialog.svelte';
  import type { DialogSize } from './sizes.ts';

  /** A progressive-enhancement POST: the confirm button submits this form. */
  export interface ConfirmForm {
    /** The form's `action` — a SvelteKit named action (`?/delete`) or a path. */
    readonly action: string;
    /** Always `POST`; spelled out because a destructive GET is a bug. */
    readonly method?: 'POST' | undefined;
    /**
     * Extra fields to post, rendered as hidden inputs INSIDE the form. They
     * live here rather than in `children` because `children` renders in the
     * dialog body, which is outside the form element.
     */
    readonly fields?: Readonly<Record<string, string>> | undefined;
    /**
     * The app's own `use:enhance`, applied to the `<form>` element. Returns
     * its teardown, if it has one. Omit for a plain, unenhanced POST.
     */
    readonly enhance?: ((form: HTMLFormElement) => void | (() => void)) | undefined;
  }

  interface Props {
    /** Whether the dialog is shown. Bindable. */
    open?: boolean | undefined;
    /** Heading — the dialog's accessible name. */
    title: string;
    /** What confirming does, in the reader's terms. */
    description?: string | undefined;
    /**
     * Text of the confirm button.
     * @defaultValue `'Delete'`
     */
    confirmLabel?: string | undefined;
    /**
     * Text of the cancel button.
     * @defaultValue `'Cancel'`
     */
    cancelLabel?: string | undefined;
    /**
     * The confirm button's text while the callback is in flight.
     * @defaultValue `'Working…'`
     */
    pendingLabel?: string | undefined;
    /**
     * Shown when the callback rejects with something that is not an `Error`.
     * @defaultValue `'That didn’t work. Try again.'`
     */
    failureMessage?: string | undefined;
    /**
     * Accessible name of the corner close button.
     * @defaultValue `'Close'`
     */
    closeLabel?: string | undefined;
    /**
     * Colour of the confirm button.
     * @defaultValue `'error'`
     */
    tone?: Tone | undefined;
    /**
     * Width of the dialog.
     * @defaultValue `'md'`
     */
    size?: DialogSize | undefined;
    /** Client-side confirmation. Mutually exclusive with `form`. */
    onConfirm?: (() => Promise<unknown>) | undefined;
    /** Progressive-enhancement POST. Mutually exclusive with `onConfirm`. */
    form?: ConfirmForm | undefined;
    /** Navigated to through the components context once `onConfirm` resolves. */
    redirectTo?: string | undefined;
    /** Extra classes, merged last. */
    class?: string | undefined;
    /** The opening control — the caller's own element, spreading `props`. */
    trigger?: Snippet<[{ props: Record<string, unknown> }]> | undefined;
    /** Extra body content: a list of what will be destroyed, a reason field. */
    children?: Snippet<[]> | undefined;
  }

  let {
    open = $bindable(false),
    title,
    description,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    pendingLabel = 'Working…',
    failureMessage = 'That didn’t work. Try again.',
    closeLabel = 'Close',
    tone = 'error',
    size = 'md',
    onConfirm,
    form,
    redirectTo,
    class: className,
    trigger,
    children,
  }: Props = $props();

  const context = getComponentsContext();

  let pending = $state(false);
  let errorMessage = $state<string | undefined>(undefined);

  const confirm = async (): Promise<void> => {
    if (onConfirm === undefined) return;
    pending = true;
    errorMessage = undefined;
    try {
      await onConfirm();
      open = false;
      if (redirectTo !== undefined) await context.navigate(context.href(redirectTo));
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : failureMessage;
    } finally {
      pending = false;
    }
  };

  /** The app's `enhance`, as an attachment so omitting it is a no-op. */
  const enhanceForm = (node: HTMLFormElement): void | (() => void) => form?.enhance?.(node);
</script>

<Dialog bind:open {title} {description} {closeLabel} {size} class={className} {trigger}>
  {#if children}
    {@render children()}
  {/if}
  {#if errorMessage !== undefined}
    <Alert tone="error" live="assertive">{errorMessage}</Alert>
  {/if}

  {#snippet actions({ close })}
    <Button variant="ghost" disabled={pending} onclick={close}>{cancelLabel}</Button>
    {#if form === undefined}
      <Button {tone} loading={pending} onclick={confirm}>
        {pending ? pendingLabel : confirmLabel}
      </Button>
    {:else}
      <form method={form.method ?? 'POST'} action={form.action} {@attach enhanceForm}>
        {#each Object.entries(form.fields ?? {}) as [name, value] (name)}
          <input type="hidden" {name} {value} />
        {/each}
        <Button {tone} type="submit">{confirmLabel}</Button>
      </form>
    {/if}
  {/snippet}
</Dialog>
