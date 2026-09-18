<!--
  Chip — a colour swatch beside a short code: the unit that appears in a
  legend, a result row, a filter list. Denser than a `Badge` and always
  paired with a colour, where a badge is usually paired with a tone.

  ARIA contract: when `title` is given the code is wrapped in `<abbr title>`,
  so the expansion is available to hover AND to assistive technology — which
  is the whole reason a three-letter code is acceptable here at all. The
  swatch is `aria-hidden`: it repeats the colour, which conveys nothing on
  its own. With `href` the chip is a real link and the code is its accessible
  name.

  The colour arrives as a token name, never a value — see `colour-token.ts`.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { CHIP_COLOUR_PROPERTY, colourTokenStyle } from './colour-token.ts';
  import { chipSize, chipSwatchSize, type ChipSize } from './tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    /** The short code shown in the chip. */
    label: string;
    /** The expansion, rendered as the `<abbr>` title. */
    title?: string | undefined;
    /** When set, the chip is a link to the subject's page. */
    href?: string | undefined;
    /** A CSS custom-property name the app's theme declares (`--party-alp`). */
    colourToken?: string | undefined;
    size?: ChipSize | undefined;
  }

  let {
    label,
    title,
    href,
    colourToken,
    size = 'md',
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  const style = $derived(colourTokenStyle(CHIP_COLOUR_PROPERTY, colourToken));
</script>

{#snippet body()}
  <span
    aria-hidden="true"
    class={[
      'ring-base-content/20 inline-block shrink-0 rounded-full bg-(--chip-colour) ring-1',
      chipSwatchSize[size],
    ]}
  ></span>
  {#if title !== undefined}
    <abbr {title} class="no-underline">{label}</abbr>
  {:else}
    <span>{label}</span>
  {/if}
{/snippet}

{#if href !== undefined}
  <a
    {...rest}
    href={context.href(href)}
    {style}
    class={['link link-hover inline-flex items-center font-medium', chipSize[size], className]}
  >
    {@render body()}
  </a>
{:else}
  <span
    {...rest}
    {style}
    class={['inline-flex items-center font-medium', chipSize[size], className]}
  >
    {@render body()}
  </span>
{/if}
