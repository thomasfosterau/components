<!-- @component
An APG carousel: a named, scroll-snapped strip of slides with Previous / Next buttons, slide pickers and optional, stoppable auto-rotation.
-->
<!--
  Carousel — a short, ordered set of slides moved through with Previous /
  Next, a row of slide pickers, swipe, or the keyboard, following the APG
  Carousel pattern (basic variant: the pickers are plain buttons with
  `aria-current`, not tabs).

  Hand-rolled, which AGENTS.md asks a reason for: bits-ui (and Melt UI) has
  no carousel primitive, and the scrolling belongs to CSS scroll-snap on
  daisyUI's `carousel`, which brings touch swipe and momentum for free. An
  Embla-style engine would be a third-party dependency, which belongs in its
  own package. The script here only scrolls a slide into view on a button
  press, tracks the slide in view (an `IntersectionObserver` says when to
  look; the strip's scroll position says which slide), and runs
  the rotation timer — all inside `$effect`, nothing at module top.

  ARIA contract: `<section aria-roledescription="carousel" aria-label>`;
  each slide is `role="group"` + `aria-roledescription="slide"`, named by
  position ("2 of 5"). The slide container is `aria-live="polite"` while not
  rotating and `"off"` while it is. The rotation control is the first
  focusable element; keyboard focus anywhere inside stops rotation for good
  (only the control restarts it), and pointer hover pauses it until the
  pointer leaves. Under `prefers-reduced-motion: reduce` rotation does not
  start by itself and scrolling jumps instead of gliding.

  One slide per view; Previous / Next are disabled at the ends (no wrap).
  Rotation wraps from the last slide to the first.
-->
<script lang="ts" generics="T">
  import { ChevronLeft, ChevronRight, Pause, Play } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import { carouselAlign, type CarouselAlign } from '../ui/tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /** The slides, in order. */
    items: readonly T[];
    /** Draws one slide. */
    slide: Snippet<[item: T, index: number]>;
    /** The carousel's accessible name, e.g. "Photos of Bed 4". */
    label: string;
    /**
     * Index of the slide in view. Bindable.
     * @defaultValue `0`
     */
    index?: number | undefined;
    /** Milliseconds between automatic advances; `undefined` never rotates. */
    autoplay?: number | undefined;
    /**
     * Show the slide-picker buttons.
     * @defaultValue `true`
     */
    pickers?: boolean | undefined;
    /**
     * Where each slide snaps within the viewport.
     * @defaultValue `'start'`
     */
    align?: CarouselAlign | undefined;
    /** @defaultValue `'Previous slide'` */
    previousLabel?: string | undefined;
    /** @defaultValue `'Next slide'` */
    nextLabel?: string | undefined;
    /** @defaultValue `'Stop automatic slide show'` */
    pauseLabel?: string | undefined;
    /** @defaultValue `'Start automatic slide show'` */
    playLabel?: string | undefined;
    /**
     * Name of one slide, from its 1-based position and the total.
     * @defaultValue `(n, total) => \`${n} of ${total}\``
     */
    slideLabel?: ((position: number, total: number) => string) | undefined;
    /**
     * Name of one picker button, from its slide's 1-based position.
     * @defaultValue `(n) => \`Slide ${n}\``
     */
    pickerLabel?: ((position: number) => string) | undefined;
  }

  const defaultSlideLabel = (position: number, total: number): string => `${position} of ${total}`;
  const defaultPickerLabel = (position: number): string => `Slide ${position}`;

  let {
    items,
    slide,
    label,
    index = $bindable(0),
    autoplay,
    pickers = true,
    align = 'start',
    previousLabel = 'Previous slide',
    nextLabel = 'Next slide',
    pauseLabel = 'Stop automatic slide show',
    playLabel = 'Start automatic slide show',
    slideLabel = defaultSlideLabel,
    pickerLabel = defaultPickerLabel,
    id: idProp,
    class: className,
    onfocusin,
    onpointerenter,
    onpointerleave,
    ...rest
  }: Props = $props();

  const mintedId = $props.id();
  const id = $derived(idProp ?? mintedId);
  const slidesId = $derived(`${id}-slides`);

  let scroller: HTMLDivElement | undefined = $state();
  /** The slide the observer last saw in view. */
  let observed = 0;
  /** The slide a button asked for, while its scroll is still in flight. */
  let pending: number | undefined;

  let reducedMotion = $state(false);
  /** The reader's (or the default's) choice; only the rotation control sets it back on. */
  let playing = $state(false);
  let hovered = $state(false);

  const last = $derived(Math.max(items.length - 1, 0));
  const current = $derived(Math.min(Math.max(index, 0), last));
  const rotating = $derived(autoplay !== undefined && playing && !hovered && items.length > 1);

  $effect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = query.matches;
    playing = autoplay !== undefined && !query.matches;
    const update = (event: MediaQueryListEvent): void => {
      reducedMotion = event.matches;
    };
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });

  /** Scroll the strip, not the page, so the slide at `target` is in view. */
  const reveal = (target: number): void => {
    const element = scroller?.children.item(target);
    if (!(element instanceof HTMLElement)) return;
    pending = target;
    element.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: align,
    });
  };

  /** A scroll that ended short of its target (the reader grabbed it) releases the observer. */
  const settle = (): void => {
    pending = undefined;
  };

  const go = (target: number): void => {
    index = Math.min(Math.max(target, 0), last);
  };

  // A change of `index` that the observer did not report (a button, the
  // timer, or the caller's binding) scrolls that slide into view.
  $effect(() => {
    if (current !== observed) reveal(current);
  });

  $effect(() => {
    if (scroller === undefined) return;
    const root = scroller;
    const observer = new IntersectionObserver(
      () => {
        // The entries only say that something moved: a batch can arrive late
        // and describe where the strip WAS (the initial "slide 0 is in view"
        // landing after a Next press has already scrolled on), so the slide
        // in view is read from the strip's geometry now, one slide per view.
        const width = root.clientWidth;
        if (width === 0) return;
        const seen = Math.min(Math.round(Math.abs(root.scrollLeft) / width), last);
        // Ignore the slides a long smooth scroll passes on its way.
        if (pending !== undefined && seen !== pending) return;
        pending = undefined;
        observed = seen;
        index = seen;
      },
      { root, threshold: 0.6 },
    );
    for (const child of root.children) observer.observe(child);
    root.addEventListener('scrollend', settle);
    return () => {
      observer.disconnect();
      root.removeEventListener('scrollend', settle);
    };
  });

  $effect(() => {
    if (!rotating || autoplay === undefined) return;
    const timer = setInterval(() => {
      go(current >= last ? 0 : current + 1);
    }, autoplay);
    return () => clearInterval(timer);
  });

  /** Keyboard focus inside stops rotation for good; a pointer press does not (it would fight the rotation control's own click). */
  const stopOnFocus = (event: FocusEvent & { currentTarget: EventTarget & HTMLElement }): void => {
    onfocusin?.(event);
    if (event.target instanceof Element && event.target.matches(':focus-visible')) playing = false;
  };
  const pause = (event: PointerEvent & { currentTarget: EventTarget & HTMLElement }): void => {
    onpointerenter?.(event);
    if (event.pointerType === 'mouse') hovered = true;
  };
  const resume = (event: PointerEvent & { currentTarget: EventTarget & HTMLElement }): void => {
    onpointerleave?.(event);
    hovered = false;
  };
</script>

{#snippet rotation()}
  <IconButtonCore
    label={playing ? pauseLabel : playLabel}
    size="sm"
    shape="circle"
    onclick={() => {
      playing = !playing;
    }}
  >
    {#snippet icon()}
      {#if playing}<Pause class="size-4" />{:else}<Play class="size-4" />{/if}
    {/snippet}
  </IconButtonCore>
{/snippet}

{#snippet steppers()}
  <IconButtonCore
    label={previousLabel}
    size="sm"
    shape="circle"
    aria-controls={slidesId}
    disabled={current <= 0}
    onclick={() => go(current - 1)}
  >
    {#snippet icon()}<ChevronLeft class="size-4" />{/snippet}
  </IconButtonCore>
  <IconButtonCore
    label={nextLabel}
    size="sm"
    shape="circle"
    aria-controls={slidesId}
    disabled={current >= last}
    onclick={() => go(current + 1)}
  >
    {#snippet icon()}<ChevronRight class="size-4" />{/snippet}
  </IconButtonCore>
{/snippet}

{#snippet pickerRow()}
  <div class="ms-auto flex flex-wrap gap-1">
    {#each items as _item, position (position)}
      <button
        type="button"
        class={['btn btn-xs btn-circle', position === current ? 'btn-primary' : 'btn-ghost']}
        aria-label={pickerLabel(position + 1)}
        aria-controls={slidesId}
        aria-current={position === current ? 'true' : undefined}
        onclick={() => go(position)}
      ></button>
    {/each}
  </div>
{/snippet}

{#snippet strip()}
  <div
    bind:this={scroller}
    id={slidesId}
    class={['carousel rounded-box w-full', carouselAlign[align]]}
    aria-live={rotating ? 'off' : 'polite'}
  >
    {#each items as item, position (position)}
      <div
        role="group"
        aria-roledescription="slide"
        aria-label={slideLabel(position + 1, items.length)}
        class="carousel-item w-full"
      >
        {@render slide(item, position)}
      </div>
    {/each}
  </div>
{/snippet}

<section
  {...rest}
  {id}
  aria-roledescription="carousel"
  aria-label={label}
  class={['flex flex-col gap-2', className]}
  onfocusin={stopOnFocus}
  onpointerenter={pause}
  onpointerleave={resume}
>
  <div class="flex flex-wrap items-center gap-2">
    {#if autoplay !== undefined}{@render rotation()}{/if}
    {@render steppers()}
    {#if pickers && items.length > 1}{@render pickerRow()}{/if}
  </div>
  {@render strip()}
</section>
