<!-- @component
The stages of a multi-step flow as daisyUI `steps`, with the current one marked.
-->
<!--
  Steps — a short, fixed sequence (a sign-up wizard, an order's fulfilment,
  "Plan → Sow → Transplant → Harvest") where position and state are the
  content. Unlike `Timeline`, which is dated, open-ended history.

  Each step's state comes from its own `state`, or, when that is omitted,
  from the list's `current` index: before it is complete, at it is current,
  after it is upcoming. An explicit `state` always wins, so an `error` step
  can sit in a `current`-driven wizard.

  ARIA contract: an `<ol>` named by `label`, because order is the content.
  Colour carries nothing on its own (WCAG 1.4.1): each step reads its label
  followed by a visually hidden state ("Sow, Completed"). The marker, the
  step number or a ✓ / ✕ glyph, is always a real `step-icon` span with
  `aria-hidden`. Rendering one suppresses daisyUI's `::after` number, and
  CSS generated content would otherwise join the accessible name. The
  current step carries `aria-current="step"`: on its link in link mode, on
  the `<li>` otherwise. Only steps with an `href` are links; whether an
  upcoming step is navigable is the caller's call, not this component's.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLOlAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { stepTone, type Tone } from '../ui/tones.ts';
  import { stepsOrientation, type StepsOrientation } from './sizes.ts';

  /** Where a step stands in the flow. */
  export type StepState = 'complete' | 'current' | 'upcoming' | 'error';

  /** One stage of a `Steps` list. */
  export interface StepItem {
    /** Stable key for the step. */
    readonly id: string;
    /** The step's name, read first. */
    readonly label: string;
    /** Overrides the state derived from the list's `current` index. */
    readonly state?: StepState | undefined;
    /** Makes the step a link (to revisit it), resolved through the components context's `href`. */
    readonly href?: string | undefined;
  }

  interface Props extends Omit<HTMLOlAttributes, 'children'> {
    /** The steps, in order. */
    items: readonly StepItem[];
    /** Accessible name of the list, e.g. `'Checkout progress'`. */
    label: string;
    /**
     * Index of the current step. Steps before it are complete and steps after
     * it upcoming, unless a step sets its own `state`.
     */
    current?: number | undefined;
    /** @defaultValue `'horizontal'` */
    orientation?: StepsOrientation | undefined;
    /**
     * Tone of the complete and current steps.
     * @defaultValue `'primary'`
     */
    tone?: Tone | undefined;
    /**
     * Read after a complete step's label.
     * @defaultValue `'Completed'`
     */
    completeLabel?: string | undefined;
    /**
     * Read after the current step's label.
     * @defaultValue `'Current step'`
     */
    currentLabel?: string | undefined;
    /**
     * Read after an upcoming step's label.
     * @defaultValue `'Not started'`
     */
    upcomingLabel?: string | undefined;
    /**
     * Read after a failed step's label.
     * @defaultValue `'Error'`
     */
    errorLabel?: string | undefined;
    /** Custom marker content per step (an icon), rendered in the `aria-hidden` `step-icon`. */
    marker?: Snippet<[StepItem, number]> | undefined;
  }

  let {
    items,
    label,
    current,
    orientation = 'horizontal',
    tone = 'primary',
    completeLabel = 'Completed',
    currentLabel = 'Current step',
    upcomingLabel = 'Not started',
    errorLabel = 'Error',
    marker,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();

  function stateOf(step: StepItem, index: number): StepState {
    if (step.state !== undefined) return step.state;
    if (current === undefined || index > current) return 'upcoming';
    return index < current ? 'complete' : 'current';
  }

  const stateLabels = $derived<Record<StepState, string>>({
    complete: completeLabel,
    current: currentLabel,
    upcoming: upcomingLabel,
    error: errorLabel,
  });

  const stateClasses = $derived<Record<StepState, string>>({
    complete: stepTone[tone],
    current: stepTone[tone],
    upcoming: '',
    error: stepTone.error,
  });

  const glyphs: Partial<Record<StepState, string>> = { complete: '✓', error: '✕' };
</script>

<ol {...rest} aria-label={label} class={['steps', stepsOrientation[orientation], className]}>
  {#each items as step, index (step.id)}
    {@const state = stateOf(step, index)}
    {@const ariaCurrent = state === 'current' ? 'step' : undefined}
    <li
      class={['step', stateClasses[state]]}
      aria-current={step.href === undefined ? ariaCurrent : undefined}
    >
      <span class="step-icon" aria-hidden="true">
        {#if marker}{@render marker(step, index)}{:else}{glyphs[state] ?? index + 1}{/if}
      </span>
      {#if step.href !== undefined}
        <a href={context.href(step.href)} class="link link-hover" aria-current={ariaCurrent}>
          {step.label}<span class="sr-only">, {stateLabels[state]}</span>
        </a>
      {:else}
        <span>{step.label}<span class="sr-only">, {stateLabels[state]}</span></span>
      {/if}
    </li>
  {/each}
</ol>
