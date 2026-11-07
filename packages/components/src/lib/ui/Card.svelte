<!-- @component
The bordered `base-100` surface: a padded body with an optional heading, a figure above and an actions row below.
-->
<!--
  Card — the surface. One bordered box on `base-100` with a padded body, an
  optional heading, an optional figure above it and an optional actions row
  under it.

  This component exists to END the hand-written
  `card card-border bg-base-100 p-6 shadow-sm`, of which the four apps carried
  56 copies. A bare `<Card>` renders exactly that look, so adopting it is a
  substitution and never a redesign; every knob below is an opt-in for a site
  that wanted something slightly different and previously got it by editing
  the class list in place.

  ARIA contract: `title` is a REAL heading at `headingLevel`, not a styled
  `<p>`, so a card in a list is reachable by heading navigation and the
  document outline stays true. The default is `h2` — a card under the page's
  `<h1>`. `as` picks the element that carries the semantics: `article` for a
  self-contained item (the default), `section` for a labelled region of the
  page, `div` for pure grouping, `li` for a card that is an item of a list,
  `dl` for a card that is a description list, and `form` for a card that is
  the form — the `actions` row renders inside the element, so its submit
  buttons stay in the `<form>` and it works with scripts off. For `dl`, put
  each `<dt>`/`<dd>` pair in a `<div>` (valid inside a `<dl>`): the body is a
  `<div>` too.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes, HTMLFormAttributes } from 'svelte/elements';
  import {
    cardSize,
    cardVariant,
    type CardVariant,
    type HeadingLevel,
    type Size,
  } from './tones.ts';

  /** The `<form>` attributes, for `as="form"`. */
  type FormAttributes = Pick<
    HTMLFormAttributes,
    | 'accept-charset'
    | 'action'
    | 'autocomplete'
    | 'enctype'
    | 'method'
    | 'name'
    | 'novalidate'
    | 'rel'
    | 'target'
  >;

  interface Props extends HTMLAttributes<HTMLElement>, FormAttributes {
    /**
     * The element that carries the semantics.
     * @defaultValue `'article'`
     */
    as?: 'article' | 'section' | 'div' | 'li' | 'dl' | 'form' | undefined;
    /** Heading rendered as `card-title` at the top of the body. */
    title?: string | undefined;
    /**
     * Heading level for `title`.
     * @defaultValue `2`
     */
    headingLevel?: HeadingLevel | undefined;
    /**
     * daisyUI card style.
     * @defaultValue `'border'`
     */
    variant?: CardVariant | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /**
     * Drop the body padding — for a card whose content is edge to edge.
     * @defaultValue `true`
     */
    padded?: boolean | undefined;
    /**
     * daisyUI's `shadow-sm` under the card; `false` for a flat surface.
     * @defaultValue `true`
     */
    shadow?: boolean | undefined;
    /** Extra classes on the `card-body`, for layout the caller owns. */
    bodyClass?: string | undefined;
    /** Media block rendered above the body. */
    figure?: Snippet<[]> | undefined;
    /** Buttons or links rendered in the `card-actions` row. */
    actions?: Snippet<[]> | undefined;
    /** The body, inside the padded `card-body`, under the heading. */
    children: Snippet<[]>;
  }

  let {
    as = 'article',
    title,
    headingLevel = 2,
    variant = 'border',
    size = 'md',
    padded = true,
    shadow = true,
    bodyClass,
    figure,
    actions,
    children,
    class: className,
    ...rest
  }: Props = $props();
</script>

<svelte:element
  this={as}
  {...rest}
  class={[
    'card bg-base-100',
    shadow && 'shadow-sm',
    cardVariant[variant],
    cardSize[size],
    className,
  ]}
>
  {#if figure}
    <figure>{@render figure()}</figure>
  {/if}
  <div class={['card-body', !padded && 'p-0', bodyClass]}>
    {#if title !== undefined}
      <svelte:element this={`h${headingLevel}`} class="card-title">{title}</svelte:element>
    {/if}
    {@render children()}
    {#if actions}
      <div class="card-actions justify-end">{@render actions()}</div>
    {/if}
  </div>
</svelte:element>
