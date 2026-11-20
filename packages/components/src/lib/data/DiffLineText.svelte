<!-- @component
One line of a `DiffView`: its hidden "Added:" / "Removed:" prefix, its glyph, and its text or word runs.
-->
<script lang="ts">
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import type { DiffLine } from './line-diff.ts';

  interface Props {
    line: DiffLine;
    addedLabel: string;
    removedLabel: string;
    noNewlineLabel: string;
  }

  let { line, addedLabel, removedLabel, noNewlineLabel }: Props = $props();

  const prefix: Record<DiffLine['kind'], string | undefined> = $derived({
    equal: undefined,
    insert: addedLabel,
    delete: removedLabel,
  });
  const glyph: Record<DiffLine['kind'], string> = { equal: ' ', insert: '+', delete: '−' };
</script>

<!-- Written without line breaks: the cell keeps whitespace, so a newline here would show. -->
{#if prefix[line.kind] !== undefined}<VisuallyHidden>{prefix[line.kind]} </VisuallyHidden>{/if}<span class="text-base-content/50 pe-2 select-none" aria-hidden="true">{glyph[line.kind]}</span>{#each line.segments ?? [{ kind: 'equal', text: line.text }] as segment, index (index)}{#if segment.kind === 'insert'}<ins class="bg-success/25 rounded-xs no-underline">{segment.text}</ins>{:else if segment.kind === 'delete'}<del class="bg-error/25 rounded-xs">{segment.text}</del>{:else}{segment.text}{/if}{/each}{#if line.noNewline}<span class="text-base-content/60 ms-2 text-xs">{noNewlineLabel}</span>{/if}
