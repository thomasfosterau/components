<!-- @component
Opens `ConfirmDialog`, `PromptDialog` or an alert from code: wrap the app once, then `await getDialogs().confirm({ title })` anywhere below it.
-->
<!--
  Requests queue and open one at a time, through the existing dialogs, so
  their ARIA contracts hold. With no trigger to return to, focus goes back to
  the element focused at request time; if that is gone, to its nearest
  focusable ancestor still in the page, else `<main>`.
-->
<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte';
  import { focusElement } from '../layout/focus-target.ts';
  import Button from '../ui/Button.svelte';
  import type { Tone } from '../ui/tones.ts';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import Dialog from './Dialog.svelte';
  import {
    setDialogs,
    type AlertRequest,
    type ConfirmRequest,
    type DialogsApi,
    type PromptRequest,
  } from './dialogs.ts';
  import PromptDialog from './PromptDialog.svelte';

  interface Props {
    /**
     * Text of a confirm request's confirm button when the request names none.
     * @defaultValue `'OK'`
     */
    confirmLabel?: string | undefined;
    /**
     * Text of every cancel button when the request names none.
     * @defaultValue `'Cancel'`
     */
    cancelLabel?: string | undefined;
    /**
     * Text of an alert's button when the request names none.
     * @defaultValue `'OK'`
     */
    okLabel?: string | undefined;
    /**
     * Accessible name of each dialog's corner close button.
     * @defaultValue `'Close'`
     */
    closeLabel?: string | undefined;
    /**
     * Colour of the confirm or OK button when the request names none.
     * @defaultValue `'primary'`
     */
    tone?: Tone | undefined;
    /** The app: everything that may call `getDialogs()`. */
    children: Snippet<[]>;
  }

  let {
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    okLabel = 'OK',
    closeLabel = 'Close',
    tone = 'primary',
    children,
  }: Props = $props();

  type Entry =
    | { readonly kind: 'confirm'; readonly request: ConfirmRequest; readonly settle: (value: boolean) => void }
    | {
        readonly kind: 'prompt';
        readonly request: PromptRequest;
        readonly settle: (value: string | undefined) => void;
      }
    | { readonly kind: 'alert'; readonly request: AlertRequest; readonly settle: (value: undefined) => void };

  type Queued = Entry & {
    readonly id: number;
    /** The element focused at request time, then its ancestors. */
    readonly returnPath: readonly HTMLElement[];
    readonly cleanup: () => void;
    /** What confirming produced; cancelling leaves it `undefined`. */
    answer: { readonly value: boolean | string } | undefined;
  };

  let queue = $state.raw<Queued[]>([]);
  let nextId = 0;
  const current = $derived(queue[0]);

  const ancestry = (start: Element | null): HTMLElement[] => {
    const path: HTMLElement[] = [];
    for (let node = start; node !== null; node = node.parentElement) {
      if (node instanceof HTMLElement) path.push(node);
    }
    return path;
  };

  const focusable = (element: HTMLElement): boolean =>
    element.isConnected && (element.tabIndex >= 0 || element.hasAttribute('tabindex'));

  /** Settle `entry` and drop it, so the next request opens. */
  const finish = (entry: Queued, answered: boolean): void => {
    if (!queue.includes(entry)) return;
    queue = queue.filter((other) => other !== entry);
    entry.cleanup();
    const answer = answered ? entry.answer : undefined;
    switch (entry.kind) {
      case 'confirm':
        entry.settle(answer?.value === true);
        break;
      case 'prompt':
        entry.settle(typeof answer?.value === 'string' ? answer.value : undefined);
        break;
      case 'alert':
        entry.settle(undefined);
    }
  };

  const enqueue = <T,>(make: (settle: (value: T) => void) => Entry, cancelled: T, signal?: AbortSignal): Promise<T> => {
    if (typeof document === 'undefined') {
      return Promise.reject(new Error('Dialogs are client-only: getDialogs() methods cannot run on the server.'));
    }
    if (signal?.aborted === true) return Promise.resolve(cancelled);
    return new Promise<T>((resolve) => {
      const onAbort = (): void => {
        const entry = queue.find((other) => other.id === id);
        if (entry !== undefined) finish(entry, false);
      };
      const id = nextId++;
      const entry = {
        ...make(resolve),
        id,
        returnPath: ancestry(document.activeElement),
        cleanup: () => signal?.removeEventListener('abort', onAbort),
        answer: undefined,
      } as Queued;
      signal?.addEventListener('abort', onAbort, { once: true });
      queue = [...queue, entry];
    });
  };

  const api: DialogsApi = {
    confirm: (request, signal) => enqueue<boolean>((settle) => ({ kind: 'confirm', request, settle }), false, signal),
    prompt: (request, signal) =>
      enqueue<string | undefined>((settle) => ({ kind: 'prompt', request, settle }), undefined, signal),
    alert: (request, signal) => enqueue<undefined>((settle) => ({ kind: 'alert', request, settle }), undefined, signal),
  };
  setDialogs(api);

  onDestroy(() => {
    for (const entry of queue) finish(entry, false);
  });

  /** Where focus goes when `entry` closes: its first focusable survivor, else `<main>`. */
  const returnFocus = (entry: Queued) => (): HTMLElement | undefined => {
    const [origin] = entry.returnPath;
    if (origin?.isConnected === true) return origin;
    const survivor = entry.returnPath.find(focusable);
    if (survivor !== undefined) return survivor;
    const main = document.querySelector('main');
    if (main === null) return undefined;
    focusElement(main, { preventScroll: true });
    return main;
  };

  /** `open` for the current entry: always true while shown; closing settles it. */
  const openFor = (entry: Queued) => ({
    get: () => true,
    set: (open: boolean) => {
      if (!open) finish(entry, entry.answer !== undefined);
    },
  });
</script>

{@render children()}

{#if current !== undefined}
  {@const binding = openFor(current)}
  {#key current.id}
    {#if current.kind === 'confirm'}
      <ConfirmDialog
        bind:open={binding.get, binding.set}
        title={current.request.title}
        description={current.request.description}
        confirmLabel={current.request.confirmLabel ?? confirmLabel}
        cancelLabel={current.request.cancelLabel ?? cancelLabel}
        tone={current.request.tone ?? tone}
        {closeLabel}
        finalFocus={returnFocus(current)}
        onConfirm={async () => {
          current.answer = { value: true };
        }}
      />
    {:else if current.kind === 'prompt'}
      <PromptDialog
        {closeLabel}
        {cancelLabel}
        {...current.request}
        bind:open={binding.get, binding.set}
        finalFocus={returnFocus(current)}
        onConfirm={(value) => {
          current.answer = { value };
        }}
      />
    {:else}
      <Dialog
        bind:open={binding.get, binding.set}
        title={current.request.title}
        description={current.request.description}
        {closeLabel}
        size="sm"
        finalFocus={returnFocus(current)}
      >
        {#snippet children()}{/snippet}
        {#snippet actions({ close })}
          <Button tone={current.request.tone ?? tone} onclick={close}>{current.request.okLabel ?? okLabel}</Button>
        {/snippet}
      </Dialog>
    {/if}
  {/key}
{/if}
