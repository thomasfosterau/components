<!-- @component
A horizontal or vertical rule between content, optionally labelled ("or"), in daisyUI's `divider` styles.
-->
<!--
  Divider — a rule between sections or side-by-side items, optionally with a
  short label on it ("or" between two sign-in methods).

  Hand-rolled, not on bits-ui's `Separator` (AGENTS.md asks for the reason):
  that primitive's whole contribution is `role="separator"` +
  `aria-orientation`, or `role="none"` when decorative — two attributes,
  written here directly, with no bits-ui on the always-loaded path.

  ARIA contract:
  - Unlabelled: `role="separator"`; vertical adds
    `aria-orientation="vertical"` (horizontal is the implicit default). It
    is a `<div>`, not a native `<hr>`, because daisyUI draws the rule with
    `::before` / `::after`, which a void `<hr>` cannot render.
  - Labelled: NOT a separator. A non-focusable separator's children are
    presentational, so the label would be lost to assistive technology. The
    wrapper is `role="none"` and the text reads in flow — "Sign in with a
    passkey / or / Continue with email" (WAI-ARIA 1.2, separator).
  - `decorative`: `aria-hidden="true"`, nothing announced.

  Not `MenuSeparator`, which must be an `<li>` inside a menu and defers to
  bits-ui's menu separator for roving focus; use that one inside `Menu`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    dividerAlign,
    dividerOrientation,
    dividerTone,
    type DividerAlign,
    type Tone,
  } from './tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /**
     * Which way the rule runs: `vertical` sits between side-by-side items.
     * @defaultValue `'horizontal'`
     */
    orientation?: 'horizontal' | 'vertical' | undefined;
    /**
     * The rule marks no real boundary: hide it from assistive technology.
     * @defaultValue `false`
     */
    decorative?: boolean | undefined;
    /**
     * Where a label sits along the rule.
     * @defaultValue `'center'`
     */
    align?: DividerAlign | undefined;
    /** Semantic colour of the rule. */
    tone?: Tone | undefined;
    /** Short text on the rule ("or"). */
    children?: Snippet<[]> | undefined;
  }

  let {
    orientation = 'horizontal',
    decorative = false,
    align = 'center',
    tone,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const classes = $derived([
    'divider',
    dividerOrientation[orientation],
    dividerAlign[align],
    tone !== undefined && dividerTone[tone],
    className,
  ]);
  const role = $derived(decorative || children !== undefined ? 'none' : 'separator');
</script>

<div
  {...rest}
  {role}
  aria-orientation={role === 'separator' && orientation === 'vertical' ? 'vertical' : undefined}
  aria-hidden={decorative ? 'true' : undefined}
  class={classes}
>
  {#if children}<span>{@render children()}</span>{/if}
</div>
