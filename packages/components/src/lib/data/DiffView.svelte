<!-- @component
A line-by-line diff of two texts, unified or side by side, with word highlights and collapsed unchanged runs.
-->
<!--
  ARIA contract: a `<table>` captioned by the summary. Every changed line
  starts with a visually hidden "Added:" or "Removed:", so meaning never
  rests on colour or the +/− glyph; changed words are `<ins>` / `<del>`. A
  collapsed run is a button; expanding it focuses the first revealed line.
-->
<script lang="ts">
  import { tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { MediaQuery, SvelteSet } from 'svelte/reactivity';
  import Button from '../ui/Button.svelte';
  import DiffLineText from './DiffLineText.svelte';
  import { diffBlocks, diffLines, splitRows, type DiffBlock, type DiffLine } from './line-diff.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The old text. */
    before: string;
    /** The new text. */
    after: string;
    /**
     * `'unified'` (one column), `'split'` (side by side) or `'auto'` (split from the `md` breakpoint up).
     * @defaultValue `'unified'`
     */
    layout?: 'unified' | 'split' | 'auto' | undefined;
    /**
     * Unchanged lines kept either side of a change; longer unchanged runs collapse.
     * @defaultValue `3`
     */
    context?: number | undefined;
    /**
     * Highlight the changed words within a changed line.
     * @defaultValue `true`
     */
    wordDiff?: boolean | undefined;
    /**
     * Show line numbers.
     * @defaultValue `true`
     */
    lineNumbers?: boolean | undefined;
    /**
     * Set the text in a monospace font, for code and data; prose reads better without.
     * @defaultValue `false`
     */
    mono?: boolean | undefined;
    /**
     * Heading of the old side in the split layout.
     * @defaultValue `'Before'`
     */
    beforeLabel?: string | undefined;
    /**
     * Heading of the new side in the split layout.
     * @defaultValue `'After'`
     */
    afterLabel?: string | undefined;
    /**
     * Heading of the old line numbers.
     * @defaultValue `'Before line'`
     */
    beforeLineLabel?: string | undefined;
    /**
     * Heading of the new line numbers.
     * @defaultValue `'After line'`
     */
    afterLineLabel?: string | undefined;
    /**
     * Heading of the unified layout's text column.
     * @defaultValue `'Content'`
     */
    contentLabel?: string | undefined;
    /**
     * Visually hidden prefix of an added line.
     * @defaultValue `'Added:'`
     */
    addedLabel?: string | undefined;
    /**
     * Visually hidden prefix of a removed line.
     * @defaultValue `'Removed:'`
     */
    removedLabel?: string | undefined;
    /**
     * The button that reveals a collapsed run.
     * @defaultValue `(n) => \`Show ${n} unchanged lines\``
     */
    expandLabel?: ((count: number) => string) | undefined;
    /**
     * The table's caption.
     * @defaultValue `(added, removed) => \`${added} lines added, ${removed} removed\`` (singular for one)
     */
    summaryLabel?: ((added: number, removed: number) => string) | undefined;
    /**
     * Shown instead of the table when the texts are the same.
     * @defaultValue `'No changes'`
     */
    noChangesLabel?: string | undefined;
    /**
     * Marks a last line that has no line break.
     * @defaultValue `'No newline at end of file'`
     */
    noNewlineLabel?: string | undefined;
  }

  let {
    before,
    after,
    layout = 'unified',
    context = 3,
    wordDiff = true,
    lineNumbers = true,
    mono = false,
    beforeLabel = 'Before',
    afterLabel = 'After',
    beforeLineLabel = 'Before line',
    afterLineLabel = 'After line',
    contentLabel = 'Content',
    addedLabel = 'Added:',
    removedLabel = 'Removed:',
    expandLabel = (count) => `Show ${count} unchanged lines`,
    summaryLabel = (added, removed) =>
      `${added} ${added === 1 ? 'line' : 'lines'} added, ${removed} removed`,
    noChangesLabel = 'No changes',
    noNewlineLabel = 'No newline at end of file',
    class: className,
    ...rest
  }: Props = $props();

  const wide = new MediaQuery('min-width: 48rem', false);
  const split = $derived(layout === 'split' || (layout === 'auto' && wide.current));
  const diff = $derived(diffLines(before, after, { wordDiff }));
  const blocks = $derived(diffBlocks(diff.lines, context));
  const columns = $derived(split ? (lineNumbers ? 4 : 2) : lineNumbers ? 3 : 1);

  const rowTone: Record<DiffLine['kind'], string> = {
    equal: '',
    insert: 'bg-success/10',
    delete: 'bg-error/10',
  };

  /** A collapsed run is keyed by its first line, which survives the other runs expanding. */
  const blockKey = (block: DiffBlock): string =>
    `${block.lines[0]?.beforeNumber ?? 0}:${block.lines[0]?.afterNumber ?? 0}`;
  const expanded = new SvelteSet<string>();
  let table: HTMLTableElement | undefined = $state();

  async function expand(key: string): Promise<void> {
    expanded.add(key);
    await tick();
    table?.querySelector<HTMLElement>(`[data-revealed="${key}"]`)?.focus();
  }

  const numberCell = 'text-base-content/50 w-px px-2 text-right align-top tabular-nums select-none';
  const textCell = 'px-2 align-top break-words whitespace-pre-wrap';
</script>

{#snippet text(line: DiffLine)}<DiffLineText {line} {addedLabel} {removedLabel} {noNewlineLabel} />{/snippet}

{#snippet side(line: DiffLine | undefined, number: number | undefined, focusTarget: string | undefined, hidden: boolean)}
  {#if lineNumbers}
    <td class={[numberCell, line && rowTone[line.kind]]}>{number ?? ''}</td>
  {/if}
  <td
    class={[textCell, line ? rowTone[line.kind] : 'bg-base-200']}
    tabindex={focusTarget === undefined ? undefined : -1}
    data-revealed={focusTarget}
    aria-hidden={hidden ? 'true' : undefined}
  >{#if line}{@render text(line)}{/if}</td>
{/snippet}

{#snippet sideBySide(block: DiffBlock, revealed: string | undefined)}
  {#each splitRows(block.lines) as row, index (index)}
    <tr>
      {@render side(row.before, row.before?.beforeNumber, index === 0 ? revealed : undefined, false)}
      <!-- An unchanged line is on both sides; it is read once, on the left. -->
      {@render side(row.after, row.after?.afterNumber, undefined, row.after?.kind === 'equal')}
    </tr>
  {/each}
{/snippet}

{#snippet unified(block: DiffBlock, revealed: string | undefined)}
  {#each block.lines as line, index (index)}
    {@const focusTarget = index === 0 ? revealed : undefined}
    <tr class={rowTone[line.kind]}>
      {#if lineNumbers}
        <td class={numberCell}>{line.beforeNumber ?? ''}</td>
        <td class={numberCell}>{line.afterNumber ?? ''}</td>
      {/if}
      <td class={textCell} tabindex={focusTarget === undefined ? undefined : -1} data-revealed={focusTarget}>{@render text(line)}</td>
    </tr>
  {/each}
{/snippet}

{#snippet lines(block: DiffBlock, revealed: string | undefined)}
  {#if split}{@render sideBySide(block, revealed)}{:else}{@render unified(block, revealed)}{/if}
{/snippet}

{#snippet head()}
  <tr class="border-base-300 border-b">
    {#if split}
      {#if lineNumbers}<th scope="col" class="sr-only">{beforeLineLabel}</th>{/if}
      <th scope="col" class="px-2 py-1 text-start font-semibold">{beforeLabel}</th>
      {#if lineNumbers}<th scope="col" class="sr-only">{afterLineLabel}</th>{/if}
      <th scope="col" class="px-2 py-1 text-start font-semibold">{afterLabel}</th>
    {:else}
      {#if lineNumbers}
        <th scope="col">{beforeLineLabel}</th>
        <th scope="col">{afterLineLabel}</th>
      {/if}
      <th scope="col">{contentLabel}</th>
    {/if}
  </tr>
{/snippet}

{#snippet body(block: DiffBlock)}
  {@const key = blockKey(block)}
  {#if block.kind === 'shown' || expanded.has(key)}
    {@render lines(block, block.kind === 'shown' ? undefined : key)}
  {:else}
    <tr>
      <td colspan={columns} class="bg-base-200 px-2 py-1">
        <Button variant="ghost" size="xs" onclick={() => expand(key)}>
          {expandLabel(block.lines.length)}
        </Button>
      </td>
    </tr>
  {/if}
{/snippet}

<div {...rest} class={['overflow-x-auto', className]}>
  {#if diff.added === 0 && diff.removed === 0}
    <p class="text-base-content/70">{noChangesLabel}</p>
  {:else}
    <table bind:this={table} class={['w-full border-collapse text-sm leading-6', mono && 'font-mono']}>
      <caption class="text-base-content/70 caption-top pb-2 text-start">
        {summaryLabel(diff.added, diff.removed)}
      </caption>
      <thead class={[!split && 'sr-only']}>{@render head()}</thead>
      <tbody>
        {#each blocks as block (blockKey(block))}
          {@render body(block)}
        {/each}
      </tbody>
    </table>
  {/if}
</div>
