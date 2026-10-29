<!-- @component
A stack of headed, collapsible sections on bits-ui `Accordion`, with single- or multi-open behaviour.
-->
<!--
  Accordion — a vertical stack of `AccordionItem`s, each a real heading whose
  button expands its panel. `type="single"` keeps at most one open (an FAQ, a
  care guide by season); `type="multiple"` lets any number open.

  Why not a stack of `Disclosure`s: `<summary>` has an implicit button role
  whose children are presentational, so a heading inside it drops out of the
  heading tree, and native `<details name>` groups have no "which one is
  open" value and no "keep one open" rule. A single `Disclosure` stays
  native; this is for the heading-structured, coordinated case.

  ARIA and keyboard contract (APG Accordion): bits-ui gives each trigger
  `aria-expanded`, Enter / Space to toggle, ↑ / ↓ and Home / End between
  headers. We render each header as a native `<h{headingLevel}>`, wire
  `aria-controls` from the button to its panel, and make each panel a
  `region` labelled by its button. With `required`, the open item's button
  reports `aria-disabled="true"`, so a reader isn't offered an action that
  does nothing. With `searchable` (the default) a closed panel keeps
  `hidden="until-found"`, so find-in-page still reaches it and opens it, the
  one advantage `<details>` had.

  `headingLevel`, `variant`, `joined` and `searchable` reach the items
  through context (`accordion-context.ts`), so they cannot drift per item.
-->
<script lang="ts">
  import { Accordion } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { setAccordionContext } from './accordion-context.ts';
  import type { DisclosureVariant, HeadingLevel } from './tones.ts';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
    /**
     * The level of each item's heading.
     * @defaultValue `3`
     */
    headingLevel?: HeadingLevel | undefined;
    /**
     * The expand marker, shared with `Disclosure`.
     * @defaultValue `'arrow'`
     */
    variant?: DisclosureVariant | undefined;
    /**
     * Join the items into one bordered block (daisyUI `join join-vertical`).
     * @defaultValue `true`
     */
    joined?: boolean | undefined;
    /**
     * Keep closed panels reachable by find-in-page (`hidden="until-found"`).
     * @defaultValue `true`
     */
    searchable?: boolean | undefined;
    /** Disable every item. */
    disabled?: boolean | undefined;
    /** The `AccordionItem`s. */
    children: Snippet<[]>;
  } & (
      | {
          /** At most one item open. */
          type: 'single';
          /** The open item's value, `''` for none. Bindable. */
          value?: string | undefined;
          /**
           * Refuse to close the open item, so exactly one stays open once one is.
           * @defaultValue `false`
           */
          required?: boolean | undefined;
        }
      | {
          /** Any number of items open. */
          type: 'multiple';
          /** The open items' values. Bindable. */
          value?: readonly string[] | undefined;
          required?: undefined;
        }
    );

  let {
    type,
    value = $bindable(),
    required = false,
    headingLevel = 3,
    variant = 'arrow',
    joined = true,
    searchable = true,
    disabled = false,
    children,
    class: className,
    ...rest
  }: Props = $props();

  function openValues(): readonly string[] {
    if (value === undefined || value === '') return [];
    return typeof value === 'string' ? [value] : value;
  }

  setAccordionContext({
    headingLevel: () => headingLevel,
    variant: () => variant,
    joined: () => joined,
    searchable: () => searchable,
    isOpen: (item) => openValues().includes(item),
    isLocked: (item) => type === 'single' && required && value === item,
  });

  const rootClass = $derived(['w-full', joined && 'join join-vertical', className]);
</script>

{#snippet root({ props }: { props: Record<string, unknown> })}
  <div {...rest} {...props} class={rootClass}>{@render children()}</div>
{/snippet}

{#if type === 'single'}
  <Accordion.Root
    type="single"
    {disabled}
    bind:value={
      () => (typeof value === 'string' ? value : ''),
      (next) => {
        // `required`: a change to '' is the open item closing; refuse it.
        if (required && next === '') return;
        value = next;
      }
    }
    child={root}
  />
{:else}
  <Accordion.Root
    type="multiple"
    {disabled}
    bind:value={() => [...openValues()], (next) => (value = next)}
    child={root}
  />
{/if}
