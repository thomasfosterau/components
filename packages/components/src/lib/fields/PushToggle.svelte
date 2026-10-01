<!-- @component
A `Toggle` that subscribes this browser to Web Push, or unsubscribes it, through the caller’s `enable` / `disable`.
-->
<!--
  PushToggle — the browser half of Web Push behind one `Toggle`: it reads
  whether THIS browser is subscribed, and turns the subscription on or off
  through the caller's `enable` / `disable`.

  The switch reflects this browser's registration, not the account's
  preference — two different questions, and a settings page asks both.
  `enable` / `disable` are props rather than imports because the network calls
  (subscribing with the VAPID key, registering the endpoint with the app's
  API) belong to the app's own client; injecting them keeps this package free
  of it.

  Every failure of `enable` is a different thing to tell the reader — the
  browser cannot, the site cannot, or they said no — so `enable` RESOLVES with
  an outcome instead of throwing, and each reason renders its own message.
  The switch writes back what actually happened (see `Toggle`), so a denied
  permission never reads as "on".

  The subscription state is read on mount, from the browser, rather than
  trusted from a prop: the page may be cached, and the reader may have revoked
  the permission in browser settings since it rendered. `supported` and
  `readSubscribed` default to the real browser checks and exist so a caller
  (or a test) can supply its own.

  ARIA contract: `Toggle`'s — a native checkbox with `role="switch"`, named by
  `label`. The notice under it is a polite live region, so a refusal is
  announced when it appears.
-->
<script lang="ts">
  import Toggle from './Toggle.svelte';

  /** Why `enable` did not subscribe this browser. */
  export type PushDeclineReason = 'unsupported' | 'unavailable' | 'denied';

  /**
   * What `enable` resolves with: it worked, or why not. The `_tag` shape
   * matches a tagged-union result an Effect client already returns.
   */
  export interface PushEnableResult {
    readonly _tag: 'enabled' | PushDeclineReason;
  }

  interface Props {
    /** False when the site has no push configuration (no VAPID key pair): the switch is not offered. */
    available: boolean;
    /** Subscribe this browser and register it. Resolves with the outcome rather than throwing. */
    enable: (signal: AbortSignal) => Promise<PushEnableResult>;
    /** Unsubscribe this browser. Its resolved value is ignored. */
    disable: (signal: AbortSignal) => Promise<unknown>;
    /**
     * Whether this browser can do Web Push at all.
     * @defaultValue feature detection (`serviceWorker` and `PushManager`)
     */
    supported?: boolean | undefined;
    /**
     * Whether this browser is subscribed now.
     * @defaultValue asks the service worker's `PushManager`
     */
    readSubscribed?: ((signal: AbortSignal) => Promise<boolean>) | undefined;
    /**
     * Text beside the switch; its accessible name.
     * @defaultValue `'Send push notifications to this browser'`
     */
    label?: string | undefined;
    /** A sentence under the switch. */
    description?: string | undefined;
    /**
     * Shown instead of the switch when `available` is false.
     * @defaultValue `"Push notifications aren't available on this site yet."`
     */
    unavailableMessage?: string | undefined;
    /**
     * Shown instead of the switch when the browser cannot do Web Push.
     * @defaultValue `"This browser can't receive push notifications."`
     */
    unsupportedMessage?: string | undefined;
    /** Shown when the browser’s notification permission is denied. */
    deniedMessage?: string | undefined;
    /** Extra classes, merged last. */
    class?: string | undefined;
  }

  let {
    available,
    enable,
    disable,
    supported = typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in globalThis,
    readSubscribed = async () => {
      const registration = await navigator.serviceWorker.ready;
      return (await registration.pushManager.getSubscription()) !== null;
    },
    label = 'Send push notifications to this browser',
    description,
    unavailableMessage = "Push notifications aren't available on this site yet.",
    unsupportedMessage = "This browser can't receive push notifications.",
    deniedMessage = 'This browser is blocking notifications. Allow them in your browser settings to turn this on.',
    class: className,
  }: Props = $props();

  let subscribed = $state(false);
  let notice = $state<PushDeclineReason | undefined>(undefined);

  // Aborted on unmount, so a request in flight when the reader navigates away
  // is cancelled rather than resolving into a destroyed component.
  const controller = new AbortController();
  $effect(() => () => controller.abort());

  $effect(() => {
    if (!available) return;
    if (!supported) {
      notice = 'unsupported';
      return;
    }
    void readSubscribed(controller.signal).then(
      (value) => {
        subscribed = value;
      },
      () => {
        // Unreadable is reported as off; the switch still works.
      },
    );
  });

  const apply = async (next: boolean): Promise<boolean> => {
    notice = undefined;
    if (!next) {
      await disable(controller.signal);
      return false;
    }
    const result = await enable(controller.signal);
    if (result._tag === 'enabled') return true;
    notice = result._tag;
    return false;
  };

  const messages: Record<PushDeclineReason, string> = $derived({
    unsupported: unsupportedMessage,
    unavailable: unavailableMessage,
    denied: deniedMessage,
  });
  const noticeTone: Record<PushDeclineReason, string> = {
    unsupported: 'text-base-content/70',
    unavailable: 'text-base-content/70',
    denied: 'text-warning',
  };
</script>

{#if !available}
  <p class={['text-base-content/70 text-sm', className]}>{unavailableMessage}</p>
{:else}
  <div class={['flex flex-col gap-2', className]}>
    <Toggle
      {label}
      {description}
      checked={subscribed}
      disabled={!supported}
      onChange={apply}
    />
    <p class={['text-sm', notice === undefined ? '' : noticeTone[notice]]} aria-live="polite">
      {notice === undefined ? '' : messages[notice]}
    </p>
  </div>
{/if}
