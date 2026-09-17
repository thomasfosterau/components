<!--
  DescriptionList — label / value pairs, in the four shapes a detail page
  wants them: a two-column `grid`, a bordered `card` with the labels in a
  fixed gutter, `divided` rows, or `inline` pairs running across a line.

  One component rather than the two the apps had. They had split it by how the
  VALUE arrives — one took rows as strings, the other took them as markup —
  which meant a page needing a formatted date in one row and a string in the
  next had to choose a component per list. Here the value is a prop or a
  snippet on the ROW, so both live in one list.

  `mono` marks the values that are identifiers (a formula, an InChIKey, a
  DOI) rather than sentences: those want a fixed-width face and a
  break-anywhere rule, and the ones that are prose do not.

  ARIA contract: a real `<dl>` of `<dt>`/`<dd>` pairs, which is what makes the
  label / value association exist at all — a screen reader reads a `<dd>` as
  the definition of the `<dt>` before it. The variant reaches the rows through
  context (see `description-context.ts`), never through a class on the list
  that the rows would have to guess at.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    setDescriptionListStyle,
    type DescriptionListStyle,
  } from './description-context.ts';

  type Variant = DescriptionListStyle['variant'];

  interface Props extends HTMLAttributes<HTMLElement> {
    variant?: Variant | undefined;
    /** Render values in a fixed-width face that breaks anywhere. */
    mono?: boolean | undefined;
    /** Render rows whose value is empty, rather than dropping them. */
    showEmpty?: boolean | undefined;
    /** What an empty value reads as when `showEmpty`. */
    emptyLabel?: string | undefined;
    /** The rows — `DescriptionRow`s, or any other `<dt>`/`<dd>` pairs. */
    children: Snippet<[]>;
  }

  let {
    variant = 'grid',
    mono = false,
    showEmpty = false,
    emptyLabel = 'unrecorded',
    children,
    class: className,
    ...rest
  }: Props = $props();

  // Literal lookup table: Tailwind reads the class names out of the source,
  // so a template string would emit no CSS at all.
  const listClass: Record<Variant, string> = {
    grid: 'grid grid-cols-1 gap-3 sm:grid-cols-2',
    card: 'card card-border card-body bg-base-100 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[12rem_1fr]',
    divided: 'divide-base-300 divide-y',
    inline: 'flex flex-wrap gap-x-6 gap-y-2',
  };

  // A getter, not a snapshot: the rows re-read it, so a list whose `variant`
  // changes re-styles the rows it already mounted.
  setDescriptionListStyle(() => ({ variant, mono, showEmpty, emptyLabel }));
</script>

<dl {...rest} class={[listClass[variant], className]}>
  {@render children()}
</dl>
