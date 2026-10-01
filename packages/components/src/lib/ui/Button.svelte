<!-- @component
The daisyUI `btn` with tone, variant and size; `loading` disables it and sets `aria-busy` without changing its name.
-->
<!--
  Button — the daisyUI `btn`, with tone / variant / size chosen from literal
  lookup tables and a `loading` state that is a real busy state rather than a
  spinner drawn over a live control.

  ARIA contract: a native `<button>`, so role and keyboard (Enter and Space)
  come from the platform and nothing is hand-rolled. While `loading` the
  button is `disabled` AND `aria-busy="true"` — disabled alone says "you may
  not", busy says "it is already happening" — and the spinner that replaces
  the leading icon is `aria-hidden`, because the accessible name must not
  change when the state does.

  `type` defaults to `button`: a button inside a form that does not say what
  it is submits it, which is almost never what a call site means.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import {
    buttonSize,
    buttonTone,
    buttonVariant,
    type ButtonVariant,
    type Size,
    type Tone,
  } from './tones.ts';

  interface Props extends HTMLButtonAttributes {
    /** Semantic colour. Omitted, the button is daisyUI's neutral `btn`. */
    tone?: Tone | undefined;
    /**
     * daisyUI button style.
     * @defaultValue `'solid'`
     */
    variant?: ButtonVariant | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /** Disables the button, marks it busy and shows a spinner. */
    loading?: boolean | undefined;
    /** Full-width. */
    block?: boolean | undefined;
    /** Leading icon, replaced by the spinner while `loading`. */
    icon?: Snippet<[]> | undefined;
    /** The button text; its accessible name. */
    children: Snippet<[]>;
  }

  let {
    tone,
    variant = 'solid',
    size = 'md',
    loading = false,
    block = false,
    icon,
    children,
    type = 'button',
    disabled = false,
    class: className,
    ...rest
  }: Props = $props();
</script>

<button
  {...rest}
  {type}
  disabled={disabled || loading}
  aria-busy={loading ? 'true' : undefined}
  class={[
    'btn',
    tone !== undefined && buttonTone[tone],
    buttonVariant[variant],
    buttonSize[size],
    block && 'btn-block',
    className,
  ]}
>
  {#if loading}
    <span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
  {:else if icon}
    {@render icon()}
  {/if}
  {@render children()}
</button>
