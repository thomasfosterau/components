<!-- @component
The daisyUI `alert`: a tone-coloured notice with an icon, an optional lead-in and an optional dismiss button.
-->
<!--
  Alert — the daisyUI `alert`: a tone-coloured notice with an icon, an
  optional bold lead-in and an optional dismiss button.

  ARIA contract, and the reason `live` is a prop rather than a constant: an
  alert that is on the page when it loads must NOT be announced, an alert
  that appears in response to something the reader did must be, and the
  urgency depends on what happened. `live` picks between `role="alert"`
  (assertive — interrupt, the default for `error`), `role="status"` (polite —
  wait for a pause, the default for everything else) and `off`, which renders
  no role at all. Static page furniture wants `off`; a form failure wants
  `assertive`.

  A live region must be IN the document before its content changes, so an app
  that swaps an alert's text keeps the component mounted; one that mounts the
  alert on failure gets the announcement from the insertion.

  The tone icon is `aria-hidden` — it restates the tone, which the text
  already carries — and the dismiss button is a labelled `Button`, not a
  bare glyph.
-->
<script lang="ts">
  import { CircleCheck, CircleX, Info, TriangleAlert, X } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Button from './Button.svelte';
  import { alertTone, alertVariant, type AlertVariant, type StatusTone } from './tones.ts';
  import VisuallyHidden from './VisuallyHidden.svelte';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /**
     * Status colour and icon.
     * @defaultValue `'info'`
     */
    tone?: StatusTone | undefined;
    /**
     * daisyUI alert style.
     * @defaultValue `'soft'`
     */
    variant?: AlertVariant | undefined;
    /** Bold lead-in rendered above the body. */
    title?: string | undefined;
    /**
     * How — and whether — assistive technology announces this alert.
     * Defaults to `assertive` for `error` and `polite` for every other tone.
     */
    live?: 'assertive' | 'polite' | 'off' | undefined;
    /** Replace the tone's default icon. */
    icon?: Snippet<[]> | undefined;
    /** When set, renders a dismiss button that calls it. */
    onDismiss?: (() => void) | undefined;
    /**
     * Accessible name of the dismiss button.
     * @defaultValue `'Dismiss'`
     */
    dismissLabel?: string | undefined;
    /** The message, after the optional bold lead-in. */
    children: Snippet<[]>;
  }

  let {
    tone = 'info',
    variant = 'soft',
    title,
    live,
    icon,
    onDismiss,
    dismissLabel = 'Dismiss',
    children,
    class: className,
    ...rest
  }: Props = $props();

  const liveness = $derived(live ?? (tone === 'error' ? 'assertive' : 'polite'));
  // `role="alert"` already implies `aria-live="assertive"` and `role="status"`
  // implies `polite`; spelling the second one out as well is how a region ends
  // up announced twice.
  const role = $derived(
    liveness === 'assertive' ? 'alert' : liveness === 'polite' ? 'status' : undefined,
  );
</script>

<div {...rest} {role} class={['alert', alertTone[tone], alertVariant[variant], className]}>
  {#if icon}
    {@render icon()}
  {:else if tone === 'success'}
    <CircleCheck class="size-5 shrink-0" aria-hidden="true" />
  {:else if tone === 'warning'}
    <TriangleAlert class="size-5 shrink-0" aria-hidden="true" />
  {:else if tone === 'error'}
    <CircleX class="size-5 shrink-0" aria-hidden="true" />
  {:else}
    <Info class="size-5 shrink-0" aria-hidden="true" />
  {/if}
  <div>
    {#if title !== undefined}
      <p class="font-semibold">{title}</p>
    {/if}
    {@render children()}
  </div>
  {#if onDismiss}
    <Button variant="ghost" size="sm" class="btn-square" onclick={onDismiss}>
      <X class="size-4" aria-hidden="true" />
      <VisuallyHidden>{dismissLabel}</VisuallyHidden>
    </Button>
  {/if}
</div>
