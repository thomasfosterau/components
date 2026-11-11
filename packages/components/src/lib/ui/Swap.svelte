<!-- @component
A presentational two-state swap (daisyUI `swap`): shows its `on` or `off` face from the `active` prop, with no input, role or name of its own.
-->
<!--
  Swap — the visual half of an on/off state: sun ↔ moon, outline ↔ filled
  star, play ↔ pause. It is DISPLAY ONLY. Its state is the `active` prop,
  driven through daisyUI 5's `swap-active` class rather than the usual
  hidden checkbox, so it owns no input, no role and no name: the control
  around it (`ThemeToggle`'s switch, a `ToggleButton`) is the one place the
  state is exposed and announced. An interactive swap would be a fourth
  on/off control beside `Toggle`, `Checkbox` and `ToggleButton` — two names
  for one state.

  ARIA contract: the root is `aria-hidden`, because both faces restate a
  state the parent control already exposes; nothing inside a `Swap` may be
  focusable. No live region — a change is announced by the parent.

  `'indeterminate'`: daisyUI shows `swap-indeterminate` only for an
  `input:indeterminate`, never through a class, so without an input only the
  `indeterminate` face (else `off`) is rendered for that state, with no
  transition. daisyUI's transitions already sit behind
  `prefers-reduced-motion: no-preference`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { swapEffect, type SwapEffect } from './tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
    /**
     * Which face shows: `true` → `on`, `false` → `off`, `'indeterminate'` → `indeterminate`.
     * @defaultValue `false`
     */
    active?: boolean | 'indeterminate' | undefined;
    /**
     * The transition between the faces.
     * @defaultValue `'fade'`
     */
    effect?: SwapEffect | undefined;
    /** Shown while `active` is false. */
    off: Snippet<[]>;
    /** Shown while `active` is true. */
    on: Snippet<[]>;
    /** Shown while `active` is `'indeterminate'`; `off` when omitted. */
    indeterminate?: Snippet<[]> | undefined;
  }

  let {
    active = false,
    effect = 'fade',
    off,
    on,
    indeterminate,
    class: className,
    ...rest
  }: Props = $props();
</script>

<span
  {...rest}
  aria-hidden="true"
  class={['swap', swapEffect[effect], active === true && 'swap-active', className]}
>
  {#if active === 'indeterminate'}
    <span class="contents">{@render (indeterminate ?? off)()}</span>
  {:else}
    <span class="swap-on">{@render on()}</span>
    <span class="swap-off">{@render off()}</span>
  {/if}
</span>
