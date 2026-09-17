<!--
  LinkButton — an `<a>` wearing the daisyUI `btn`, for navigation that reads
  as an action ("View results", "Edit"). It is a link, not a button: it
  navigates, so it must be an anchor and must keep Ctrl-click, middle-click
  and "copy link address".

  ARIA contract: a disabled link keeps its text but drops its `href`, takes
  `role="button"` + `aria-disabled="true"` and leaves the tab order with
  `tabindex="-1"` — an `<a>` without `href` is not focusable and has no role,
  so both have to be restored by hand for the disabled state to be announced
  at all. `external` opens a new tab with `rel="noreferrer"`, which implies
  `noopener`; the pairing is not something a call site should be able to
  forget.

  `href` resolves through the components context (base path, locale prefix)
  unless the link is `external`, where the destination is an absolute URL the
  app has no business rewriting.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import {
    buttonSize,
    buttonTone,
    buttonVariant,
    type ButtonVariant,
    type Size,
    type Tone,
  } from './tones.ts';

  interface Props extends Omit<HTMLAnchorAttributes, 'href'> {
    href: string;
    tone?: Tone | undefined;
    variant?: ButtonVariant | undefined;
    size?: Size | undefined;
    /** Renders the button as unavailable without removing its text. */
    disabled?: boolean | undefined;
    block?: boolean | undefined;
    /** Open in a new tab with the safe `rel`. */
    external?: boolean | undefined;
    /** Leading icon. */
    icon?: Snippet<[]> | undefined;
    children: Snippet<[]>;
  }

  let {
    href,
    tone,
    variant = 'solid',
    size = 'md',
    disabled = false,
    block = false,
    external = false,
    icon,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  const resolved = $derived(external ? href : context.href(href));
</script>

<a
  {...rest}
  href={disabled ? undefined : resolved}
  role={disabled ? 'button' : undefined}
  aria-disabled={disabled ? 'true' : undefined}
  tabindex={disabled ? -1 : undefined}
  target={external ? '_blank' : undefined}
  rel={external ? 'noreferrer' : undefined}
  class={[
    'btn',
    tone !== undefined && buttonTone[tone],
    buttonVariant[variant],
    buttonSize[size],
    block && 'btn-block',
    disabled && 'btn-disabled',
    className,
  ]}
>
  {#if icon}
    {@render icon()}
  {/if}
  {@render children()}
</a>
