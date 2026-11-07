<!-- @component
An icon beside a title, shown as title and icon, icon only or title only; the title is always real text for assistive technology.
-->
<!--
  IconLabel — an icon beside a title ("🌧 12 mm", "📍 Bed 4"), the pair list
  rows, menu items, badges and nav items are built from. SwiftUI's `Label`
  with `.labelStyle(…)` is the model: the title stays the accessible text in
  every style, so a containing control or link takes its name from it.

  - `title-and-icon` (the default): both shown.
  - `icon-only`: the title moves inside `VisuallyHidden`, still in the DOM,
    so `<button><IconLabel labelStyle="icon-only" …/></button>` is named by
    it. `tooltip` shows it on hover and focus as well; use that only where
    the IconLabel is itself focusable or sits inside a focusable control.
  - `title-only`: the icon is not rendered.

  ARIA contract: the icon is `aria-hidden`; the title is text. Responsive
  switching (title-and-icon on wide screens, icon-only on narrow) is the
  caller's: two instances gated by Tailwind breakpoints, or a container
  query, rather than breakpoints baked in here.

  The icon is sized `1em` and the gap is `gap-1.5`, so the pair scales with
  the text around it. `trailingIcon` puts the icon after the title; the
  order is logical, so it follows the reading direction.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { IconLabelStyle } from './tones.ts';
  import Tooltip from './Tooltip.svelte';
  import VisuallyHidden from './VisuallyHidden.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'title'> {
    /** The text; in `icon-only` style it is still in the DOM, visually hidden. */
    title: string;
    /** The icon; rendered `aria-hidden`. */
    icon?: Snippet<[]> | undefined;
    /**
     * Which of the two are shown.
     * @defaultValue `'title-and-icon'`
     */
    labelStyle?: IconLabelStyle | undefined;
    /**
     * Put the icon after the title instead of before it.
     * @defaultValue `false`
     */
    trailingIcon?: boolean | undefined;
    /**
     * In `icon-only` style, also show `title` as a tooltip.
     * @defaultValue `false`
     */
    tooltip?: boolean | undefined;
  }

  let {
    title,
    icon,
    labelStyle = 'title-and-icon',
    trailingIcon = false,
    tooltip = false,
    class: className,
    ...rest
  }: Props = $props();

  const showIcon = $derived(icon !== undefined && labelStyle !== 'title-only');
</script>

{#snippet glyph()}
  {#if showIcon && icon}
    <span aria-hidden="true" class="inline-flex size-[1em] shrink-0 items-center justify-center">
      {@render icon()}
    </span>
  {/if}
{/snippet}

{#snippet pair(props: Record<string, unknown>)}
  <span {...rest} {...props} class={['inline-flex items-center gap-1.5', className]}>
    {#if !trailingIcon}{@render glyph()}{/if}
    {#if labelStyle === 'icon-only'}
      <VisuallyHidden>{title}</VisuallyHidden>
    {:else}
      <span>{title}</span>
    {/if}
    {#if trailingIcon}{@render glyph()}{/if}
  </span>
{/snippet}

{#if tooltip && labelStyle === 'icon-only'}
  <Tooltip text={title}>
    {#snippet children({ props })}
      {@const { 'aria-describedby': _describedBy, ...triggerProps } = props}
      {@render pair(triggerProps)}
    {/snippet}
  </Tooltip>
{:else}
  {@render pair({})}
{/if}
