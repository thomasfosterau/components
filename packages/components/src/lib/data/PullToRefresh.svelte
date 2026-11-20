<!-- @component
Pull-to-refresh around a scrolling list, with a Refresh button and an optional hotkey that do the same without the gesture.
-->
<!--
  Pointer handling is hand-rolled: no bits-ui primitive covers it. A pull
  starts only from a touch or pen at the top, where `touch-action` stops the
  browser panning. The button is always in the DOM, visually hidden on
  touch, for screen-reader users who can't pull.
-->
<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLAttributes } from 'svelte/elements';
  import { MediaQuery } from 'svelte/reactivity';
  import { tryGetHotkeyRegistry } from '../hotkeys/context.svelte.ts';
  import type { HotkeyTrigger } from '../hotkeys/types.ts';
  import Button from '../ui/Button.svelte';
  import Spinner from '../ui/Spinner.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /**
     * Reloads the data; the indicator stays until it settles. The signal aborts
     * if the component unmounts. A rejection is yours to report (a toast); the
     * component resets and announces nothing.
     */
    onRefresh: (signal: AbortSignal) => Promise<void>;
    /** The list. */
    children: Snippet<[]>;
    /**
     * Pull distance, in CSS pixels, that triggers a refresh.
     * @defaultValue `72`
     */
    threshold?: number | undefined;
    /**
     * Show the Refresh button. `'auto'` shows it when the primary pointer is
     * fine (a mouse); otherwise it stays in the DOM, visually hidden until focused.
     * @defaultValue `'auto'`
     */
    showButton?: boolean | 'auto' | undefined;
    /**
     * The Refresh button's name, and the hotkey's label.
     * @defaultValue `'Refresh'`
     */
    refreshLabel?: string | undefined;
    /**
     * Announced when a refresh starts.
     * @defaultValue `'Refreshing…'`
     */
    refreshingLabel?: string | undefined;
    /**
     * Announced when a refresh succeeds.
     * @defaultValue `'Updated'`
     */
    refreshedLabel?: string | undefined;
    /** A trigger (`'r'`) registered with the hotkey registry while mounted, when one exists. */
    hotkey?: HotkeyTrigger | undefined;
    /**
     * Whether a refresh is running. Bindable; set it to `true` to start one.
     * @defaultValue `false`
     */
    refreshing?: boolean | undefined;
    /** Ignore the gesture, the button and the hotkey. */
    disabled?: boolean | undefined;
  }

  let {
    onRefresh,
    children,
    threshold = 72,
    showButton = 'auto',
    refreshLabel = 'Refresh',
    refreshingLabel = 'Refreshing…',
    refreshedLabel = 'Updated',
    hotkey,
    refreshing = $bindable(false),
    disabled = false,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const finePointer = new MediaQuery('pointer: fine', true);
  const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);
  const buttonVisible = $derived(showButton === 'auto' ? finePointer.current : showButton);

  /** The settled height of the indicator while a refresh runs. */
  const REFRESHING_HEIGHT = 48;

  let atTop = $state(true);
  let pull = $state(0);
  let announcement = $state('');
  let gesture: { readonly pointerId: number; readonly startY: number } | undefined;
  let controller: AbortController | undefined;

  const indicatorHeight = $derived.by(() => {
    if (refreshing) return REFRESHING_HEIGHT;
    // Under reduced motion the indicator appears at the threshold instead of following the finger.
    if (reducedMotion.current) return pull >= threshold ? REFRESHING_HEIGHT : 0;
    return Math.min(pull, threshold * 1.5);
  });

  async function refresh(): Promise<void> {
    if (controller !== undefined || disabled) return;
    const current = new AbortController();
    controller = current;
    refreshing = true;
    announcement = refreshingLabel;
    try {
      await onRefresh(current.signal);
      if (!current.signal.aborted) announcement = refreshedLabel;
    } catch {
      if (!current.signal.aborted) announcement = '';
    } finally {
      if (controller === current) {
        controller = undefined;
        refreshing = false;
        pull = 0;
      }
    }
  }

  // A caller setting `refreshing` starts a refresh.
  $effect(() => {
    if (refreshing && controller === undefined) untrack(() => void refresh());
  });

  $effect(() => () => controller?.abort());

  const registry = tryGetHotkeyRegistry();
  $effect(() => {
    if (registry === undefined || hotkey === undefined) return;
    const batch = [
      {
        id: `pull-to-refresh-${uid}`,
        label: refreshLabel,
        trigger: hotkey,
        group: 'actions' as const,
        run: () => refresh(),
      },
    ];
    return untrack(() => registry.register('page', batch));
  });

  /** At the top of the list, or of the page when the list doesn't scroll itself. */
  function isAtTop(scroller: HTMLElement): boolean {
    if (scroller.scrollHeight > scroller.clientHeight) return scroller.scrollTop <= 0;
    return window.scrollY <= 0;
  }

  /** The pull gesture; an attachment, since the button and hotkey are its accessible equivalents. */
  const pullGesture: Attachment<HTMLElement> = (node) => {
    const down = (event: PointerEvent): void => pointerdown(event, node);
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', pointermove);
    node.addEventListener('pointerup', pointerup);
    node.addEventListener('pointercancel', pointercancel);
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', pointermove);
      node.removeEventListener('pointerup', pointerup);
      node.removeEventListener('pointercancel', pointercancel);
    };
  };

  function pointerdown(event: PointerEvent, scroller: HTMLElement): void {
    if (disabled || controller !== undefined || event.pointerType === 'mouse' || !isAtTop(scroller)) {
      return;
    }
    gesture = { pointerId: event.pointerId, startY: event.clientY };
  }

  function pointermove(event: PointerEvent): void {
    if (gesture?.pointerId !== event.pointerId) return;
    pull = Math.max(0, event.clientY - gesture.startY);
  }

  function pointerup(event: PointerEvent): void {
    if (gesture?.pointerId !== event.pointerId) return;
    gesture = undefined;
    if (pull >= threshold) void refresh();
    else pull = 0;
  }

  function pointercancel(): void {
    gesture = undefined;
    pull = 0;
  }
</script>

<div {...rest} class={className} style:display="flex" style:flex-direction="column">
  <div class="flex justify-end">
    <Button
      variant="ghost"
      size="sm"
      loading={refreshing}
      {disabled}
      class={[!buttonVisible && 'sr-only focus-visible:not-sr-only']}
      onclick={() => refresh()}
    >
      {refreshLabel}
    </Button>
  </div>
  <div role="status" class="sr-only">{announcement}</div>
  <div
    class="flex items-center justify-center overflow-hidden"
    style:height="{indicatorHeight}px"
    aria-hidden="true"
  >
    {#if refreshing}
      <Spinner decorative size="sm" />
    {:else if indicatorHeight > 0}
      <div
        class="radial-progress text-primary"
        style:--value={Math.min(100, Math.round((pull / threshold) * 100))}
        style:--size="1.5rem"
        style:--thickness="2px"
      ></div>
    {/if}
  </div>
  <!-- Structural styles are inline: they are the behaviour, not the look. -->
  <div
    style:flex="1 1 0"
    style:min-height="0"
    style:overflow-y="auto"
    style:overscroll-behavior-y="contain"
    style:touch-action={atTop && !disabled ? 'pan-x pan-down' : 'auto'}
    aria-busy={refreshing}
    onscroll={(event) => (atTop = isAtTop(event.currentTarget))}
    {@attach pullGesture}
  >
    {@render children()}
  </div>
</div>
