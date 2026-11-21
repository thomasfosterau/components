<!-- @component
The thin bar across the top of the viewport while a client-side navigation or a long request is in flight, drawn from a `NavigationProgressApi`.
-->
<!--
  NavigationProgress — nothing for an operation shorter than `delay`; then a
  bar that trickles toward the end, jumps to full when the last operation is
  done, and fades. Under `prefers-reduced-motion: reduce` it does not
  trickle or animate: a static bar at 30%, then full.

  ARIA contract: a `role="progressbar"` named by `label`. While the progress
  is a trickle it has no `aria-valuenow`, since the trickle is a fiction;
  after `set(n)` it reports the real percentage. Announcements are sparse: a
  polite `loadingLabel` only if the wait outlasts `delay` by a second more,
  and `loadedLabel`, when set, after one that was announced. SvelteKit
  already announces the new page's title, so the default says nothing at the
  end. `aria-busy` on the page is the app's call, not this component's.
-->
<script module lang="ts">
  import type { Tone } from '../ui/tones.ts';

  /** Literal background class per `Tone`; a lookup table so Tailwind's scanner sees every class. */
  const barTone: Record<Tone, string> = {
    neutral: 'bg-neutral',
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    info: 'bg-info',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  /** Bar thickness per size step. */
  const barHeight = { xs: 'h-px', sm: 'h-0.5', md: 'h-1' } as const;

  /** How long after `delay` the wait is announced. */
  const ANNOUNCE_AFTER = 1000;
  /** How long the full bar stays before it is removed; the fade runs inside it. */
  const FINISH = 450;
  const TRICKLE_EVERY = 250;
  /** Where the trickle starts and the ceiling it approaches but never reaches. */
  const TRICKLE_FROM = 0.1;
  const TRICKLE_TO = 0.9;
  const REDUCED_AT = 0.3;

  const reducedMotion = (): boolean =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getNavigationProgress, type NavigationProgressApi } from './navigation-progress.svelte.ts';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The store to draw; the one `setNavigationProgress` published when omitted. */
    progress?: NavigationProgressApi | undefined;
    /**
     * Show nothing for an operation shorter than this, in milliseconds.
     * @defaultValue `150`
     */
    delay?: number | undefined;
    /**
     * Bar colour.
     * @defaultValue `'primary'`
     */
    tone?: Tone | undefined;
    /**
     * Bar thickness: 1, 2 or 4 pixels.
     * @defaultValue `'sm'`
     */
    size?: keyof typeof barHeight | undefined;
    /**
     * The progress bar's accessible name.
     * @defaultValue `'Loading page'`
     */
    label?: string | undefined;
    /**
     * Announced once when a wait outlasts `delay` by a second.
     * @defaultValue `'Loading'`
     */
    loadingLabel?: string | undefined;
    /** Announced when an announced wait ends; silent when omitted. */
    loadedLabel?: string | undefined;
  }

  let {
    progress: progressProp,
    delay = 150,
    tone = 'primary',
    size = 'sm',
    label = 'Loading page',
    loadingLabel = 'Loading',
    loadedLabel,
    class: className,
    ...rest
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const progress = progressProp ?? getNavigationProgress();

  let phase = $state<'idle' | 'waiting' | 'showing' | 'finishing'>('idle');
  let trickle = $state(TRICKLE_FROM);
  let reduced = $state(false);
  let announcement = $state('');
  let announced = false;

  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let announceTimer: ReturnType<typeof setTimeout> | undefined;
  let finishTimer: ReturnType<typeof setTimeout> | undefined;
  let trickleTimer: ReturnType<typeof setInterval> | undefined;

  const stopTimers = (): void => {
    clearTimeout(showTimer);
    clearTimeout(announceTimer);
    clearTimeout(finishTimer);
    clearInterval(trickleTimer);
  };

  const show = (): void => {
    phase = 'showing';
    reduced = reducedMotion();
    trickle = reduced ? REDUCED_AT : TRICKLE_FROM;
    if (!reduced) {
      trickleTimer = setInterval(() => {
        trickle += (TRICKLE_TO - trickle) * 0.15;
      }, TRICKLE_EVERY);
    }
    announceTimer = setTimeout(() => {
      announcement = loadingLabel;
      announced = true;
    }, ANNOUNCE_AFTER);
  };

  const begin = (): void => {
    if (phase === 'showing' || phase === 'waiting') return;
    clearTimeout(finishTimer);
    if (phase === 'finishing') {
      show();
      return;
    }
    phase = 'waiting';
    announcement = '';
    showTimer = setTimeout(show, delay);
  };

  const finish = (): void => {
    stopTimers();
    if (phase !== 'showing') {
      phase = 'idle';
      return;
    }
    phase = 'finishing';
    announcement = announced ? (loadedLabel ?? '') : '';
    announced = false;
    finishTimer = setTimeout(() => {
      phase = 'idle';
    }, FINISH);
  };

  $effect(() => {
    const active = progress.active;
    untrack(() => (active ? begin() : finish()));
  });

  $effect(() => stopTimers);

  const fraction = $derived(phase === 'finishing' ? 1 : (progress.value ?? trickle));
  const percent = $derived(progress.value === undefined ? undefined : Math.round(progress.value * 100));
</script>

{#if phase === 'showing' || phase === 'finishing'}
  <div
    {...rest}
    role="progressbar"
    aria-label={label}
    aria-valuemin={percent === undefined ? undefined : 0}
    aria-valuemax={percent === undefined ? undefined : 100}
    aria-valuenow={percent}
    class={['pointer-events-none fixed inset-x-0 top-0 z-50', barHeight[size], className]}
  >
    <div
      class={['h-full w-full origin-left', barTone[tone]]}
      style:transform="scaleX({fraction})"
      style:opacity={phase === 'finishing' && !reduced ? 0 : 1}
      style:transition={reduced ? 'none' : 'transform 200ms ease-out, opacity 250ms ease-in 150ms'}
    ></div>
  </div>
{/if}
<div role="status" class="sr-only">{announcement}</div>
