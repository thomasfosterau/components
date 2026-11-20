<!-- @component
One `JsonView` row: the key, then a typed value or a container's size. Internal.
-->
<!--
  The accessible name reads "count: 12, number" or "beds, array, 4 items":
  quotes and brackets are `aria-hidden`, the type word is visually hidden.
  Tags sit on one line, as whitespace between them would enter the name.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Highlight from '../formatting/Highlight.svelte';
  import type { JsonEntry, JsonKind, JsonPathSegment } from './json-path.ts';

  interface Props {
    entry: JsonEntry;
    path: string;
    keyLabel: string;
    query: string;
    typeLabel: string;
    sizeLabel: string;
    circularLabel: string;
    /** The string as shown: whole, or cut with an ellipsis. */
    text: string;
    truncated: boolean;
    moreLabel: string;
    renderValue?:
      | Snippet<[{ value: unknown; path: readonly JsonPathSegment[] }]>
      | undefined;
  }

  let {
    entry,
    path,
    keyLabel,
    query,
    typeLabel,
    sizeLabel,
    circularLabel,
    text,
    truncated,
    moreLabel,
    renderValue,
  }: Props = $props();

  const valueClasses: Record<JsonKind, string> = {
    string: 'text-info',
    number: 'text-success',
    boolean: 'text-warning',
    null: 'text-base-content/50',
    object: 'text-base-content/60',
    array: 'text-base-content/60',
    circular: 'text-base-content/50 italic',
  };
  const brackets = $derived(entry.kind === 'array' ? ['[', ']'] : ['{', '}']);
  const keyClass = $derived(typeof entry.key === 'number' ? 'text-base-content/60' : 'font-medium');
</script>

{#snippet primitive()}
  {#if renderValue}{@render renderValue({ value: entry.value, path: entry.path })}{:else if entry.kind === 'string'}<span aria-hidden="true">"</span><Highlight {text} {query} /><span aria-hidden="true">"</span>{#if truncated}{' '}<span class="link link-primary">{moreLabel}</span>{/if}{:else}<Highlight text={entry.kind === 'null' ? 'null' : String(entry.value)} {query} />{/if}
{/snippet}

<span class="min-w-0 truncate font-mono text-sm" data-json-path={path}><span class={keyClass}><Highlight text={keyLabel} {query} /></span>{#if entry.kind === 'object' || entry.kind === 'array'}<span class="sr-only">, {typeLabel},</span> <span aria-hidden="true" class="text-base-content/50">{brackets[0]}</span><span class={valueClasses[entry.kind]}>{sizeLabel}</span><span aria-hidden="true" class="text-base-content/50">{brackets[1]}</span>{:else}<span class="text-base-content/50">:</span> <span class={valueClasses[entry.kind]}>{#if entry.kind === 'circular'}{circularLabel}{:else}{@render primitive()}{/if}</span><span class="sr-only">, {typeLabel}</span>{/if}</span>
