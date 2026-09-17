<!--
  DiffText — a word-level diff rendered inline: inserted runs in `<ins>`,
  deleted runs in `<del>`, unchanged runs plain.

  ARIA contract: `<ins>` and `<del>` are the contract. They are what carries
  "added" and "removed" into the accessibility tree and into a copy of the
  page; the colour and the strike-through are the sighted reader's copy of
  the same information, never the only copy. Support for announcing the two
  elements is uneven across screen readers, so `insertLabel` / `deleteLabel`
  add a visually hidden word before a run when the diff is the point of the
  page rather than a detail on it — off by default, because a forty-segment
  diff with a prefix on every run is unreadable.

  `separator` sits BETWEEN segments rather than inside them: a word-level
  diff needs the space and a character-level one must not have it, and only
  the caller knows which it produced. That is also why the template below is
  written without line breaks between the runs — a newline in the markup is a
  space in the output, and it would make the choice for them.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import type { DiffSegment } from './diff.ts';

  interface Props extends Omit<HTMLAttributes<HTMLParagraphElement>, 'children'> {
    segments: readonly DiffSegment[];
    /** Rendered between segments — a space for a word-level diff. */
    separator?: string | undefined;
    /** A visually hidden word before each inserted run. */
    insertLabel?: string | undefined;
    /** A visually hidden word before each deleted run. */
    deleteLabel?: string | undefined;
  }

  let {
    segments,
    separator = ' ',
    insertLabel,
    deleteLabel,
    class: className,
    ...rest
  }: Props = $props();
</script>

{#snippet run(segment: DiffSegment)}{#if segment.kind === 'insert'}<ins class="bg-success/20 text-success-content decoration-success underline">{#if insertLabel !== undefined}<VisuallyHidden>{insertLabel}</VisuallyHidden>{/if}{segment.text}</ins>{:else if segment.kind === 'delete'}<del class="bg-error/20 text-error-content">{#if deleteLabel !== undefined}<VisuallyHidden>{deleteLabel}</VisuallyHidden>{/if}{segment.text}</del>{:else}{segment.text}{/if}{/snippet}

<p {...rest} class={['leading-7', className]}>{#each segments as segment, index (index)}{#if index > 0}{separator}{/if}{@render run(segment)}{/each}</p>
