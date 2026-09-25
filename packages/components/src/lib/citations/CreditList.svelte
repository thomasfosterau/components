<!--
  CreditList — a locale-joined byline for one role: the authors, the editors,
  the translators, or any other credited role a citation carries. Generalises
  website's `Authors` / `Editors` / `Translators`, which were the same
  component three times over (a `FormatList` of names, each wrapped in
  Schema.org microdata, plus one role's own punctuation) into one.

  Each credit renders as a `Person` or `Organization` microdata item when it
  carries an `itemtype` — a name with a known Agent behind it — and as plain
  (`itemprop`-only) text otherwise, matching website's fallback for a credit
  whose Agent did not resolve but whose name survived.

  `roleLabel` / `roleLabelPosition` generalise the label each of the three
  source components hard-coded: `Editors` printed "(ed)"/"(eds)" AFTER the
  names, `Translators` printed "trans." BEFORE them. The defaults below
  reproduce both; a caller naming a role of its own supplies its own label.

  List punctuation comes from `./list-format.ts`, not the `formatting/`
  family's `FormatList` — see that module's header for why.
-->
<script lang="ts">
  import { getComponentsContext } from '../context.svelte.ts';
  import { formatListParts } from './list-format.ts';

  /** One credited name. */
  export interface Credit {
    readonly name: string;
    /** Link to the credited party's own page, if it has one. */
    readonly href?: string | undefined;
    /** Present exactly when the credit resolved to a real Agent. */
    readonly itemtype?: 'Person' | 'Organization' | undefined;
  }

  interface Props {
    credits: readonly Credit[];
    /** The role this list credits — also the default Schema.org `itemprop`. */
    role?: string | undefined;
    /** Count → the role's punctuation, e.g. `(n) => (n > 1 ? '(eds)' : '(ed)')`. */
    roleLabel?: ((count: number) => string) | undefined;
    roleLabelPosition?: 'before' | 'after' | undefined;
    /** Overrides `role` as the Schema.org property each credit carries. */
    itemprop?: string | undefined;
    locales?: string | readonly string[] | undefined;
    style?: Intl.ListFormatOptions['style'] | undefined;
    type?: Intl.ListFormatOptions['type'] | undefined;
    class?: string | undefined;
  }

  let {
    credits,
    role = 'author',
    roleLabel,
    roleLabelPosition,
    itemprop,
    locales,
    style = 'long',
    type = 'conjunction',
    class: className,
  }: Props = $props();

  const ctx = getComponentsContext();

  /** Reproduces `Editors.svelte` (after) and `Translators.svelte` (before). */
  const defaultRoleLabel = (count: number): string => {
    if (role === 'editor') return count > 1 ? '(eds)' : '(ed)';
    if (role === 'translator') return 'trans.';
    return '';
  };

  const resolvedRoleLabel = $derived(roleLabel ?? defaultRoleLabel);
  const resolvedPosition = $derived(roleLabelPosition ?? (role === 'translator' ? 'before' : 'after'));
  const labelText = $derived(credits.length > 0 ? resolvedRoleLabel(credits.length) : '');
  const creditItemprop = $derived(itemprop ?? role);
  const parts = $derived(
    formatListParts(credits, { locales: locales ?? ctx.locale(), style, type }),
  );
</script>

{#if credits.length > 0}
  <span class={['inline', className]}>
    {#if labelText !== '' && resolvedPosition === 'before'}
      {labelText}
    {/if}
    {#each parts as part, index (index)}
      {#if part.kind === 'item'}
        {@const credit = part.value}
        {#if credit.itemtype !== undefined}
          <span itemprop={creditItemprop} itemscope itemtype={`https://schema.org/${credit.itemtype}`}>
            {#if credit.href !== undefined}
              <a itemprop="name" href={ctx.href(credit.href)}>{credit.name}</a>
            {:else}
              <span itemprop="name">{credit.name}</span>
            {/if}
          </span>
        {:else if credit.href !== undefined}
          <a itemprop={creditItemprop} href={ctx.href(credit.href)}>{credit.name}</a>
        {:else}
          <span itemprop={creditItemprop}>{credit.name}</span>
        {/if}
      {:else}
        {part.value}
      {/if}
    {/each}{#if labelText !== '' && resolvedPosition === 'after'}{' '}{labelText}{/if}</span
  >
{/if}
