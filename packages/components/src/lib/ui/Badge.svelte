<!-- @component
The daisyUI `badge`: a short inline label for a status, a count or a category.
-->
<!--
  Badge — the daisyUI `badge`: a short, inline label for a status, a count or
  a category.

  Two colour paths. A semantic `tone` picks the badge's daisyUI colour, which
  is what a status ("Draft", "Overdue") wants. A `colourToken` instead names a
  custom property the consuming app's theme declares, which is what a
  subject-coloured label (a party, a rank, a project) wants: the badge then
  tints its border and a translucent fill from that one variable and keeps
  `base-content` text, so it stays legible on either theme whatever the hue.
  `colourToken` wins over `tone` — a subject's colour is not a tone.

  ARIA contract: none, deliberately. A badge is a decorative frame around
  text, so the text has to carry the meaning: a status badge showing only a
  colour is a status nobody can read. If the badge's own text is not enough
  in context, label the thing it sits on, not the badge.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { BADGE_COLOUR_PROPERTY, colourTokenStyle } from './colour-token.ts';
  import {
    badgeSize,
    badgeTone,
    badgeVariant,
    type BadgeVariant,
    type Size,
    type Tone,
  } from './tones.ts';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    /**
     * Semantic colour.
     * @defaultValue `'neutral'`
     */
    tone?: Tone | undefined;
    /**
     * daisyUI badge style.
     * @defaultValue `'soft'`
     */
    variant?: BadgeVariant | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /**
     * A CSS custom-property name the app's theme declares (`--party-alp`).
     * Overrides `tone` and `variant`; falls back to the theme's neutral
     * colour when the token is undeclared.
     */
    colourToken?: string | undefined;
    /** The label. */
    children: Snippet<[]>;
  }

  let {
    tone = 'neutral',
    variant = 'soft',
    size = 'md',
    colourToken,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const classes = $derived(
    colourToken === undefined
      ? ['badge', badgeTone[tone], badgeVariant[variant], badgeSize[size], className]
      : [
          'badge border-(--badge-colour) bg-(--badge-colour)/15 text-base-content',
          badgeSize[size],
          className,
        ],
  );
</script>

<span {...rest} class={classes} style={colourTokenStyle(BADGE_COLOUR_PROPERTY, colourToken)}>
  {@render children()}
</span>
