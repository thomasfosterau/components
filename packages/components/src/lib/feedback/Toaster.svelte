<!-- @component
The notification region, plus the context that lets any descendant push a toast into it (`getToaster().add({ title: 'Saved' })`).
-->
<!--
  Toaster — the notification region, plus the context that lets any descendant
  push into it (`getToaster().add({ title: 'Saved' })`).

  Hand-rolled rather than on a bits-ui primitive, deliberately: there is no
  interaction to get right. A toast takes no focus, traps nothing and has no
  keyboard contract of its own — it is a live region with a queue and a timer,
  and the queue is a plain rune.

  ARIA contract: ONE `aria-live="polite"` region, named by `regionLabel`, and
  nothing live inside it. The tempting `role="status"` on each toast is the
  bug this replaces: a status inside a live region makes assistive technology
  announce the same text twice, and a region that is only created when the
  first toast arrives is often not announced at all — so the region is in the
  document from mount, empty, and only its contents change. Dismiss is a
  labelled text button, not a bare glyph.

  A toast may carry one `action` ("Bed deleted · Undo"): a real button after
  the text and before Dismiss, with a visually hidden `actionHint` ("Undo
  available") in the toast's text so the announcement says there is something
  to reach. Focus is never moved into the region; the reader reaches the
  button with Tab, since the region follows the app in the document. While
  `onAction` is pending the button is `loading` (`aria-busy`, name unchanged);
  a rejection keeps the toast, now sticky and in the error tone, with
  `formatActionError(error)` in place of its description.

  Timing (WCAG 2.2.1): a toast with an action lives `actionDurationMs`, never
  the short default, and every toast's timer pauses while the pointer is over
  it, focus is inside it, its action is pending, or the page is hidden.
  Timers are held in a map and cleared on destroy: a toast that outlives its
  page would otherwise write to a component that is gone. `result(id)` settles
  once per toast; destroying the region settles what is left as `'dismissed'`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import { alertTone } from '../ui/tones.ts';
  import Button from '../ui/Button.svelte';
  import { toastPosition, type ToastPosition } from './sizes.ts';
  import { setToaster, type Toast, type ToastOutcome, type ToasterApi } from './toaster.ts';

  interface Props {
    /**
     * Which corner the stack grows from.
     * @defaultValue `'bottom-end'`
     */
    position?: ToastPosition | undefined;
    /**
     * Accessible name of the live region.
     * @defaultValue `'Notifications'`
     */
    regionLabel?: string | undefined;
    /**
     * Accessible name of every toast's dismiss button.
     * @defaultValue `'Dismiss'`
     */
    dismissLabel?: string | undefined;
    /**
     * How long a toast lives when `add` is given no duration. `0` = sticky.
     * @defaultValue `6_000`
     */
    durationMs?: number | undefined;
    /**
     * How long a toast with an `action` lives when `add` is given no duration;
     * long enough to reach and use the button. `0` = sticky.
     * @defaultValue `10_000`
     */
    actionDurationMs?: number | undefined;
    /**
     * The visually hidden hint that tells a screen-reader user a toast has an
     * action, given the action's label.
     * @defaultValue `` (label) => `${label} available` ``
     */
    actionHint?: ((label: string) => string) | undefined;
    /**
     * The text that replaces a toast's description when its action rejects.
     * @defaultValue the error's `message`, or `'Something went wrong.'`
     */
    formatActionError?: ((error: unknown) => string) | undefined;
    /** Extra classes on the region. */
    class?: string | undefined;
    /** The application. Rendered above the region. */
    children: Snippet<[]>;
  }

  let {
    position = 'bottom-end',
    regionLabel = 'Notifications',
    dismissLabel = 'Dismiss',
    durationMs = 6_000,
    actionDurationMs = 10_000,
    actionHint = (label) => `${label} available`,
    formatActionError = (error) =>
      error instanceof Error && error.message !== '' ? error.message : 'Something went wrong.',
    class: className,
    children,
  }: Props = $props();

  /** A toast's timer: what is left of its duration, and why it is held. */
  interface Clock {
    remaining: number;
    startedAt: number;
    timer: ReturnType<typeof setTimeout> | undefined;
    hovered: boolean;
    focused: boolean;
    busy: boolean;
  }

  let toasts = $state<Toast[]>([]);
  /** Ids whose action is running. */
  let busy = $state<Record<number, true>>({});
  /** Ids whose action rejected, with the text shown in place of the description. */
  let failed = $state<Record<number, string>>({});
  let nextId = 1;
  let pageHidden = false;
  const clocks = new Map<number, Clock>();
  /** Each live toast's `result` promise, and the function that settles it. */
  const results = new Map<number, Promise<ToastOutcome>>();
  const resolvers = new Map<number, (outcome: ToastOutcome) => void>();
  const outcomes = new Map<number, ToastOutcome>();
  const aborter = new AbortController();

  const held = (clock: Clock): boolean => clock.hovered || clock.focused || clock.busy || pageHidden;

  const pause = (clock: Clock): void => {
    if (clock.timer === undefined) return;
    clearTimeout(clock.timer);
    clock.timer = undefined;
    clock.remaining -= Date.now() - clock.startedAt;
  };

  const run = (id: number, clock: Clock): void => {
    if (clock.timer !== undefined || held(clock)) return;
    clock.startedAt = Date.now();
    clock.timer = setTimeout(() => end(id, 'timeout'), Math.max(0, clock.remaining));
  };

  /** Re-evaluate one clock after something that holds it changed. */
  const hold = (id: number, reason: 'hovered' | 'focused' | 'busy', on: boolean): void => {
    const clock = clocks.get(id);
    if (clock === undefined) return;
    clock[reason] = on;
    if (held(clock)) pause(clock);
    else run(id, clock);
  };

  const stopClock = (id: number): void => {
    const clock = clocks.get(id);
    if (clock?.timer !== undefined) clearTimeout(clock.timer);
    clocks.delete(id);
  };

  const end = (id: number, outcome: ToastOutcome): void => {
    if (outcomes.has(id)) return;
    stopClock(id);
    toasts = toasts.filter((toast) => toast.id !== id);
    delete busy[id];
    delete failed[id];
    outcomes.set(id, outcome);
    resolvers.get(id)?.(outcome);
    resolvers.delete(id);
    results.delete(id);
  };

  const dismiss = (id: number): void => end(id, 'dismissed');

  /**
   * Hold a toast's timer while the pointer is over it or focus is inside it.
   * Listeners rather than `on*` attributes: the toast is not itself an
   * interactive element, and has no role to give it.
   */
  const holdWhileUsed = (id: number): Attachment<HTMLElement> => {
    const enter = (): void => hold(id, 'hovered', true);
    const leave = (): void => hold(id, 'hovered', false);
    const focusIn = (): void => hold(id, 'focused', true);
    return (node) => {
      const focusOut = (event: FocusEvent): void => {
        const next = event.relatedTarget;
        if (!(next instanceof Node && node.contains(next))) hold(id, 'focused', false);
      };
      node.addEventListener('pointerenter', enter);
      node.addEventListener('pointerleave', leave);
      node.addEventListener('focusin', focusIn);
      node.addEventListener('focusout', focusOut);
      return () => {
        node.removeEventListener('pointerenter', enter);
        node.removeEventListener('pointerleave', leave);
        node.removeEventListener('focusin', focusIn);
        node.removeEventListener('focusout', focusOut);
      };
    };
  };

  const act = async (toast: Toast): Promise<void> => {
    if (toast.action === undefined || busy[toast.id]) return;
    busy[toast.id] = true;
    delete failed[toast.id];
    hold(toast.id, 'busy', true);
    try {
      await toast.action.onAction(aborter.signal);
      end(toast.id, 'action');
    } catch (error) {
      if (outcomes.has(toast.id)) return;
      delete busy[toast.id];
      failed[toast.id] = formatActionError(error);
      // Sticky from here: the reader has to see the failure and may retry.
      stopClock(toast.id);
    }
  };

  const api: ToasterApi = {
    add(toast, duration) {
      const id = nextId++;
      toasts = [...toasts, { ...toast, tone: toast.tone ?? 'info', id }];
      results.set(
        id,
        new Promise<ToastOutcome>((resolve) => {
          resolvers.set(id, resolve);
        }),
      );
      const lifetime = duration ?? (toast.action === undefined ? durationMs : actionDurationMs);
      if (lifetime > 0) {
        const clock: Clock = {
          remaining: lifetime,
          startedAt: 0,
          timer: undefined,
          hovered: false,
          focused: false,
          busy: false,
        };
        clocks.set(id, clock);
        run(id, clock);
      }
      return id;
    },
    dismiss,
    result(id) {
      const outcome = outcomes.get(id);
      if (outcome !== undefined) return Promise.resolve(outcome);
      const pending = results.get(id);
      if (pending !== undefined) return pending;
      return Promise.reject(new Error(`No toast with id ${id} was added to this <Toaster>`));
    },
  };

  setToaster(api);

  const onVisibility = (): void => {
    pageHidden = document.visibilityState === 'hidden';
    for (const [id, clock] of clocks) {
      if (held(clock)) pause(clock);
      else run(id, clock);
    }
  };

  $effect(() => {
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  });

  $effect(() => () => {
    aborter.abort();
    for (const id of resolvers.keys()) end(id, 'dismissed');
    for (const clock of clocks.values()) if (clock.timer !== undefined) clearTimeout(clock.timer);
    clocks.clear();
  });
</script>

{@render children()}

<div
  class={['toast z-50', toastPosition[position], className]}
  aria-live="polite"
  aria-label={regionLabel}
>
  {#each toasts as toast (toast.id)}
    {@const error = failed[toast.id]}
    <div
      class={['alert items-start shadow-lg', alertTone[error === undefined ? toast.tone : 'error']]}
      {@attach holdWhileUsed(toast.id)}
    >
      <div>
        <p class="font-semibold">{toast.title}</p>
        {#if error !== undefined}
          <p class="text-sm">{error}</p>
        {:else if toast.description !== undefined}
          <p class="text-sm">{toast.description}</p>
        {/if}
        {#if toast.action !== undefined}
          <span class="sr-only">{actionHint(toast.action.label)}</span>
        {/if}
      </div>
      {#if toast.action !== undefined}
        <Button variant="outline" size="sm" loading={busy[toast.id] === true} onclick={() => act(toast)}>
          {toast.action.label}
        </Button>
      {/if}
      <Button variant="ghost" size="sm" onclick={() => dismiss(toast.id)}>{dismissLabel}</Button>
    </div>
  {/each}
</div>
