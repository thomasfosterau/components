<!-- @component
The tooltip-free core of `IconButton`: an icon-only button or link whose accessible name is a required `label`.
-->
<!--
  IconButtonCore — the icon-only naming rule, without the tooltip: `label`
  is required and is the control's `aria-label`, the icon is `aria-hidden`,
  the hit target is at least 24×24 CSS px at every size (WCAG 2.2 SC 2.5.8:
  `btn-xs` is exactly that at a 16px root, and `min-h-6 min-w-6` keeps it so
  under a smaller one), and `href` makes it a context-resolved link with
  `aria-current="page"` on the current page.

  Why a separate file: `IconButton` adds bits-ui's `Tooltip`, and with it
  floating-ui — measured at about 34 kB gzip on top of a plain `Button`. The
  library's own always-loaded controls (`Alert`'s dismiss, `SearchInput`'s
  clear) use this core so that weight never reaches a page that did not ask
  for a tooltip. It is internal: apps use `IconButton`, whose `tooltip`
  defaults on.

  The caller's attributes are spread first (including a tooltip or
  disclosure trigger's props), and `label`, `class` and the disabled wiring
  always win.
  `focusableWhenDisabled` is `IconButton`'s tooltip case: disabled, the
  control is `aria-disabled` rather than `disabled`, so it stays focusable
  and hoverable, and activation is swallowed. daisyUI sets
  `pointer-events: none` on `[aria-disabled=true]`, which would stop the
  hover, so `pointer-events-auto` undoes it (utilities outrank daisyUI's
  component layer).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import Spinner from './Spinner.svelte';
  import {
    buttonSize,
    buttonTone,
    buttonVariant,
    type ButtonVariant,
    type Size,
    type Tone,
  } from './tones.ts';

  /** The button-only attributes; ignored when `href` makes it a link. */
  type ButtonOnly = Pick<
    HTMLButtonAttributes,
    'disabled' | 'form' | 'formaction' | 'formmethod' | 'name' | 'value'
  >;

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'>, ButtonOnly {
    /** Accessible name and tooltip text. Required: an icon has no name of its own. */
    label: string;
    /** The icon; rendered `aria-hidden`. */
    icon: Snippet<[]>;
    /** Navigate instead of act: the control is a link to this app path. */
    href?: string | undefined;
    /**
     * Disabled, stay focusable (`aria-disabled`) instead of `disabled`.
     * @defaultValue `false`
     */
    focusableWhenDisabled?: boolean | undefined;
    /** Semantic colour. Omitted, the button is daisyUI's neutral `btn`. */
    tone?: Tone | undefined;
    /**
     * daisyUI button style.
     * @defaultValue `'ghost'`
     */
    variant?: ButtonVariant | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /**
     * `btn-square` or `btn-circle`.
     * @defaultValue `'square'`
     */
    shape?: 'square' | 'circle' | undefined;
    /** Marks the control busy and swaps the icon for a spinner. */
    loading?: boolean | undefined;
    /**
     * The button's type; set `'submit'` explicitly when it submits a form.
     * @defaultValue `'button'`
     */
    type?: 'button' | 'submit' | 'reset' | undefined;
  }

  let {
    label,
    icon,
    href,
    focusableWhenDisabled = false,
    tone,
    variant = 'ghost',
    size = 'md',
    shape = 'square',
    loading = false,
    type = 'button',
    disabled = false,
    class: className,
    form,
    formaction,
    formmethod,
    name,
    value,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  const unavailable = $derived(disabled === true || loading);
  const resolved = $derived(href === undefined ? undefined : context.href(href));

  const classes = $derived([
    'btn min-h-6 min-w-6',
    shape === 'circle' ? 'btn-circle' : 'btn-square',
    tone !== undefined && buttonTone[tone],
    buttonVariant[variant],
    buttonSize[size],
    unavailable && 'btn-disabled',
    unavailable && focusableWhenDisabled && 'pointer-events-auto cursor-not-allowed',
    className,
  ]);

  /** A disabled control that stays focusable must still not activate. */
  const guard = (event: MouseEvent): void => {
    if (!unavailable) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
</script>

{#snippet face()}
  {#if loading}
    <Spinner decorative size="sm" />
  {:else}
    <span aria-hidden="true" class="contents">{@render icon()}</span>
  {/if}
{/snippet}

{#if resolved !== undefined}
  <a
    {...rest}
    href={unavailable ? undefined : resolved}
    role={unavailable ? 'link' : undefined}
    aria-label={label}
    aria-disabled={unavailable ? 'true' : undefined}
    aria-current={!unavailable && context.isCurrent(resolved) ? 'page' : undefined}
    class={classes}
    onclickcapture={guard}
  >
    {@render face()}
  </a>
{:else}
  <button
    {...rest}
    {type}
    {form}
    {formaction}
    {formmethod}
    {name}
    {value}
    aria-label={label}
    disabled={unavailable && !focusableWhenDisabled}
    aria-disabled={unavailable && focusableWhenDisabled ? 'true' : undefined}
    aria-busy={loading ? 'true' : undefined}
    class={classes}
    onclickcapture={guard}
  >
    {@render face()}
  </button>
{/if}
