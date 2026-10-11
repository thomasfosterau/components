<!-- @component
One label/value pair inside an `InfoboxSection`.
-->
<!--
  InfoboxRow — one label/value pair inside an `InfoboxSection`.

  Absent by default: a row with neither a `value` nor `children` renders no
  DOM at all, so a page can build a run of rows straight off sparse resource
  attributes without guarding each one — the same "has something to show"
  contract `infoboxRowIsPresent` gives the typed `rows` convenience on
  `Infobox`. `showEmpty` opts back: an em
  dash captioned by `emptyLabel`, which says "asked, and there is no answer"
  rather than "nobody asked" — for a section that always lists the same
  facts, where a gap is itself informative.

  `href` wraps the row's content in the shared `Link`, so an in-app path
  resolves through the components context exactly like every other link in
  the library; `external` is `Link`'s own external-link contract, passed
  straight through.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Link from '../ui/Link.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The term, rendered as the `<dt>`. */
    label: string;
    /** Plain text or number; `children` wins where both are supplied. */
    value?: string | number | undefined;
    /** Richer markup — a formatted quantity, a badge, more than one link. */
    children?: Snippet<[]> | undefined;
    /** Wraps the row's content in a `Link` resolved through the components context. */
    href?: string | undefined;
    /** Passed through to `Link` — an off-site destination. */
    external?: boolean | undefined;
    /**
     * Stands in for the value, captioned by `aria-label`, when `showEmpty` and the row has nothing.
     * @defaultValue `'unrecorded'`
     */
    emptyLabel?: string | undefined;
    /** Render the row even when empty, showing `emptyLabel` instead of nothing. */
    showEmpty?: boolean | undefined;
  }

  let {
    label,
    value,
    children,
    href,
    external,
    emptyLabel = 'unrecorded',
    showEmpty = false,
    class: className,
    ...rest
  }: Props = $props();

  const hasValue = $derived(value !== undefined && value !== '');
  const present = $derived(children !== undefined || hasValue);
</script>

{#if present || showEmpty}
  <div
    {...rest}
    class={[
      'hover:bg-base-100 grid grid-cols-3 gap-2 px-4 py-2 transition-colors',
      className,
    ]}
  >
    <dt class="text-base-content/70 col-span-1 text-sm font-semibold select-none">{label}</dt>
    <dd class="col-span-2 text-sm">
      {#if present && href !== undefined}
        <Link {href} external={external ?? false}>
          {#if children}{@render children()}{:else}{value}{/if}
        </Link>
      {:else if present && children}
        {@render children()}
      {:else if present}
        {value}
      {:else}
        <span class="text-base-content/40" aria-label={emptyLabel}>&mdash;</span>
      {/if}
    </dd>
  </div>
{/if}
