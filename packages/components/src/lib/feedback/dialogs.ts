/**
 * The dialogs seam: what `getDialogs()` returns and how anything below a
 * `<DialogHost>` reaches it. Kept out of `DialogHost.svelte` so a module that
 * only asks a question imports a `.ts` file rather than three dialogs.
 *
 * @module
 */

import { getContext, setContext, type ComponentProps } from 'svelte';
import type { Tone } from '../ui/tones.ts';
import type PromptDialog from './PromptDialog.svelte';

/** A yes-or-no question, as `DialogsApi.confirm` takes it. */
export interface ConfirmRequest {
  /** Heading — the dialog's accessible name. */
  readonly title: string;
  /** What confirming does, in the reader's terms. */
  readonly description?: string | undefined;
  /** Text of the confirm button; the `DialogHost`'s `confirmLabel` when omitted. */
  readonly confirmLabel?: string | undefined;
  /** Text of the cancel button; the `DialogHost`'s `cancelLabel` when omitted. */
  readonly cancelLabel?: string | undefined;
  /** Colour of the confirm button; `'error'` for a destructive action. */
  readonly tone?: Tone | undefined;
}

/** A request for one short value, as `DialogsApi.prompt` takes it: `PromptDialog`'s props, less the wiring. */
export type PromptRequest = Omit<
  ComponentProps<typeof PromptDialog>,
  'open' | 'onConfirm' | 'form' | 'trigger' | 'finalFocus' | 'class'
>;

/** A message to acknowledge, as `DialogsApi.alert` takes it. */
export interface AlertRequest {
  /** Heading — the dialog's accessible name. */
  readonly title: string;
  /** The message under the heading. */
  readonly description?: string | undefined;
  /** Text of the button that closes it; the `DialogHost`'s `okLabel` when omitted. */
  readonly okLabel?: string | undefined;
  /** Colour of that button. */
  readonly tone?: Tone | undefined;
}

/**
 * What `getDialogs()` returns. Requests open one at a time, in the order they
 * were made. Aborting `signal` closes the dialog (or drops it from the queue)
 * and resolves as cancelled. Each method throws when called on the server.
 */
export interface DialogsApi {
  /** Resolves `true` when confirmed, `false` when cancelled, dismissed or aborted. */
  confirm(request: ConfirmRequest, signal?: AbortSignal): Promise<boolean>;
  /** Resolves with the confirmed value, or `undefined` when cancelled, dismissed or aborted. */
  prompt(request: PromptRequest, signal?: AbortSignal): Promise<string | undefined>;
  /** Resolves once the dialog closes, however it closes. */
  alert(request: AlertRequest, signal?: AbortSignal): Promise<void>;
}

const DIALOGS_KEY = Symbol('@thomasfosterau/components:dialogs');

/** Publish the host's API to its descendants. Called by `DialogHost`. */
export function setDialogs(api: DialogsApi): void {
  setContext<DialogsApi>(DIALOGS_KEY, api);
}

/** The nearest `<DialogHost>`'s API. Throws when there is none. */
export function getDialogs(): DialogsApi {
  const api = getContext<DialogsApi | undefined>(DIALOGS_KEY);
  if (api === undefined) throw new Error('getDialogs() was called outside a <DialogHost>');
  return api;
}
