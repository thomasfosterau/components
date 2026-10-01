<!-- @component
One label and its value inside a `DescriptionList`.
-->
<!--
  DescriptionRow — one label and its value inside a `DescriptionList`.

  A row with nothing in it renders NOTHING. An empty `<dd>` is a worse answer
  than an absent row: it claims the page looked and found a blank, where the
  absent row claims nothing at all. `showEmpty` is for the lists where the
  absence is the point — a specimen record whose empty fields are what the
  reader is checking — and it renders `emptyLabel` in the value's place.
  Both settings come from the enclosing list by default and can be overridden
  per row.

  The `card` variant's `<dt>` and `<dd>` are siblings of every other row's,
  directly in the list's two-column grid: a wrapper would break the alignment
  the grid exists for. Every other variant wraps the pair, so the two stay
  together when the rows wrap.

  ARIA contract: the `<dt>`/`<dd>` pairing is the whole contract — nothing is
  added to it, and nothing needs to be.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getDescriptionListStyle } from './description-context.ts';

  interface Props {
    /** The term, rendered as the `<dt>`. */
    label: string;
    /** The value as text. Ignored when `children` is given. */
    value?: string | number | undefined;
    /** The value as markup — a formatted date, a link, a badge. */
    children?: Snippet<[]> | undefined;
    /** Extra classes on the `<dd>`. */
    valueClass?: string | undefined;
    /** Extra classes on the `<dt>`. */
    labelClass?: string | undefined;
    /** Override the list's `showEmpty` for this row. */
    showEmpty?: boolean | undefined;
    /** Override the list's `emptyLabel` for this row. */
    emptyLabel?: string | undefined;
  }

  let { label, value, children, valueClass, labelClass, showEmpty, emptyLabel }: Props = $props();

  const style = getDescriptionListStyle();

  const hasValue = $derived(
    children !== undefined || (value !== undefined && String(value).trim() !== ''),
  );
  const visible = $derived(hasValue || (showEmpty ?? style().showEmpty));
  const placeholder = $derived(emptyLabel ?? style().emptyLabel);
  const dtClass = $derived(['text-base-content/60 text-sm', labelClass]);
  const ddClass = $derived([
    'text-sm',
    style().mono && 'font-mono break-all',
    !hasValue && 'text-base-content/50 italic',
    valueClass,
  ]);
</script>

{#snippet pair()}
  <dt class={dtClass}>{label}</dt>
  <dd class={ddClass}>
    {#if children}{@render children()}{:else if hasValue}{value}{:else}{placeholder}{/if}
  </dd>
{/snippet}

{#if visible}
  {#if style().variant === 'card'}
    {@render pair()}
  {:else if style().variant === 'inline'}
    <div class="flex items-baseline gap-2">{@render pair()}</div>
  {:else if style().variant === 'divided'}
    <div class="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">{@render pair()}</div>
  {:else}
    <div class="flex flex-col gap-0.5">{@render pair()}</div>
  {/if}
{/if}
