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

  Timers are held in a map and cleared on destroy: a toast that outlives its
  page would otherwise write to a component that is gone.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { alertTone } from '../ui/tones.ts';
  import Button from '../ui/Button.svelte';
  import { toastPosition, type ToastPosition } from './sizes.ts';
  import { setToaster, type Toast, type ToasterApi } from './toaster.ts';

  interface Props {
    /** Which corner the stack grows from. */
    position?: ToastPosition | undefined;
    /** Accessible name of the live region. */
    regionLabel?: string | undefined;
    /** Accessible name of every toast's dismiss button. */
    dismissLabel?: string | undefined;
    /** How long a toast lives when `add` is given no duration. `0` = sticky. */
    durationMs?: number | undefined;
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
    class: className,
    children,
  }: Props = $props();

  let toasts = $state<Toast[]>([]);
  let nextId = 1;
  const timers = new Map<number, ReturnType<typeof setTimeout>>();

  const dismiss = (id: number): void => {
    const timer = timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(id);
    }
    toasts = toasts.filter((toast) => toast.id !== id);
  };

  const api: ToasterApi = {
    add(toast, duration = durationMs) {
      const id = nextId++;
      toasts = [...toasts, { ...toast, tone: toast.tone ?? 'info', id }];
      if (duration > 0) timers.set(id, setTimeout(() => dismiss(id), duration));
      return id;
    },
    dismiss,
  };

  setToaster(api);

  $effect(() => () => {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
  });
</script>

{@render children()}

<div
  class={['toast z-50', toastPosition[position], className]}
  aria-live="polite"
  aria-label={regionLabel}
>
  {#each toasts as toast (toast.id)}
    <div class={['alert items-start shadow-lg', alertTone[toast.tone]]}>
      <div>
        <p class="font-semibold">{toast.title}</p>
        {#if toast.description !== undefined}
          <p class="text-sm">{toast.description}</p>
        {/if}
      </div>
      <Button variant="ghost" size="sm" onclick={() => dismiss(toast.id)}>{dismissLabel}</Button>
    </div>
  {/each}
</div>
