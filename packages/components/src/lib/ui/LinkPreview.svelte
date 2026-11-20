<!-- @component
A card of supplementary detail shown while a link is hovered or keyboard-focused (a taxon's photo, an author's bio), on bits-ui's `LinkPreview`.
-->
<!--
  LinkPreview — the link stays an ordinary link; the card is extra.

  The card is SUPPLEMENTARY: it is not focusable and not in the Tab order
  (bits-ui takes its contents out), and on touch, where nothing hovers, it
  never shows. So nothing essential may live only in it, and nothing in it
  may be interactive: a button there is unreachable by keyboard. Interactive
  content belongs in a `Popover`.

  ARIA contract: bits-ui opens the card on hover and on keyboard focus (not
  on the focus a click gives, so a click just navigates), closes it on
  leave, blur and Escape, and bridges the gap so the pointer can move onto
  it, which covers WCAG 1.4.13. It also gives the trigger `role="button"`,
  `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`; those are
  dropped from the props spread on the link, because they would turn a
  link into a button and promise a dialog a screen reader can never open.

  `load` runs the first time the card opens, with a signal aborted if it
  closes first; a `Skeleton` (`role="status"`, `loadingLabel`) shows
  meanwhile, and the result is kept for later opens.
-->
<script lang="ts" generics="T">
  import { LinkPreview } from 'bits-ui';
  import { untrack, type Snippet } from 'svelte';
  import Skeleton from './Skeleton.svelte';

  interface Props {
    /** Whether the card is shown. Bindable. */
    open?: boolean | undefined;
    /**
     * Hover time before opening, in milliseconds.
     * @defaultValue `700`
     */
    openDelay?: number | undefined;
    /**
     * Time after leaving before closing, in milliseconds.
     * @defaultValue `300`
     */
    closeDelay?: number | undefined;
    /**
     * Which side of the link the card opens on.
     * @defaultValue `'bottom'`
     */
    side?: 'top' | 'right' | 'bottom' | 'left' | undefined;
    /**
     * Alignment against the link.
     * @defaultValue `'start'`
     */
    align?: 'start' | 'center' | 'end' | undefined;
    /**
     * Distance in pixels from the link.
     * @defaultValue `8`
     */
    sideOffset?: number | undefined;
    /** Fetch the card's data the first time it opens; the signal aborts if it closes first. */
    load?: ((signal: AbortSignal) => Promise<T>) | undefined;
    /**
     * The skeleton's accessible name while `load` runs.
     * @defaultValue `'Loading preview'`
     */
    loadingLabel?: string | undefined;
    /**
     * Shown when `load` fails.
     * @defaultValue `'Preview unavailable'`
     */
    errorLabel?: string | undefined;
    /** The link: spread `props` onto your own `Link` or anchor. */
    trigger: Snippet<[{ props: Record<string, unknown> }]>;
    /** The card's body; `data` is what `load` resolved, or `undefined` without one. */
    children: Snippet<[{ data: T | undefined }]>;
    /** Extra classes on the card. */
    class?: string | undefined;
  }

  let {
    open = $bindable(false),
    openDelay = 700,
    closeDelay = 300,
    side = 'bottom',
    align = 'start',
    sideOffset = 8,
    load,
    loadingLabel = 'Loading preview',
    errorLabel = 'Preview unavailable',
    trigger,
    children,
    class: className,
  }: Props = $props();

  let phase = $state<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  let data: T | undefined = $state.raw();
  let controller: AbortController | undefined;

  /** A link's props without the button and dialog semantics bits-ui adds. */
  const linkProps = (props: Record<string, unknown>): Record<string, unknown> => {
    const {
      role: _role,
      'aria-haspopup': _haspopup,
      'aria-expanded': _expanded,
      'aria-controls': _controls,
      ...kept
    } = props;
    return kept;
  };

  const fetchPreview = async (loader: (signal: AbortSignal) => Promise<T>): Promise<void> => {
    controller = new AbortController();
    const { signal } = controller;
    phase = 'loading';
    try {
      const result = await loader(signal);
      if (signal.aborted) return;
      data = result;
      phase = 'ready';
    } catch {
      if (!signal.aborted) phase = 'failed';
    }
  };

  const openChanged = (next: boolean): void => {
    if (next && load !== undefined && (phase === 'idle' || phase === 'failed')) {
      void fetchPreview(load);
    }
    if (!next && phase === 'loading') {
      controller?.abort();
      phase = 'idle';
    }
  };

  // An effect rather than bits-ui's `onOpenChange`, so a bound `open` set by
  // the caller loads too.
  $effect(() => {
    const next = open;
    untrack(() => openChanged(next));
  });

  $effect(() => () => controller?.abort());
</script>

<LinkPreview.Root bind:open {openDelay} {closeDelay} ignoreNonKeyboardFocus>
  <LinkPreview.Trigger>
    {#snippet child({ props })}
      {@render trigger({ props: linkProps(props) })}
    {/snippet}
  </LinkPreview.Trigger>
  <LinkPreview.Portal>
    <LinkPreview.Content
      {side}
      {align}
      {sideOffset}
      class={['card card-border bg-base-100 rounded-box z-50 w-80 p-4 shadow-md', className]}
    >
      {#if phase === 'loading'}
        <Skeleton variant="text" lines={3} label={loadingLabel} />
      {:else if phase === 'failed'}
        <p class="text-base-content/70 text-sm">{errorLabel}</p>
      {:else}
        {@render children({ data })}
      {/if}
    </LinkPreview.Content>
  </LinkPreview.Portal>
</LinkPreview.Root>
