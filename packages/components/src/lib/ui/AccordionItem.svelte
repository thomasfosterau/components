<!-- @component
One headed, collapsible section of an `Accordion`.
-->
<!--
  AccordionItem — a heading whose button expands a panel. Must sit inside an
  `Accordion`, which supplies the heading level, the marker and the open
  state (see `accordion-context.ts`).

  The header is a native `<h{level}>` rendered through bits-ui's `child`
  snippet, so the redundant `role="heading"` / `aria-level` bits-ui would put
  on a `<div>` are dropped. The daisyUI marker is the heading's `::after`,
  outside the button, so it never joins the button's accessible name.
-->
<script lang="ts">
  import { Accordion } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getAccordionContext } from './accordion-context.ts';
  import { collapseVariant } from './tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Identifies the item in the `Accordion`'s `value`; defaults to a generated id. */
    value?: string | undefined;
    /** The header text, or a snippet for richer markup. */
    title: string | Snippet<[]>;
    /** Disable this item's button. */
    disabled?: boolean | undefined;
    /** Extra classes on the panel. */
    contentClass?: string | undefined;
    /** The panel's content. */
    children: Snippet<[]>;
  }

  const uid = $props.id();

  let {
    value = uid,
    title,
    disabled,
    contentClass,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const accordion = getAccordionContext();
  const triggerId = `${uid}-trigger`;
  const contentId = `${uid}-content`;
  const open = $derived(accordion.isOpen(value));
  const locked = $derived(accordion.isLocked(value));
</script>

<Accordion.Item {value} {...disabled === undefined ? {} : { disabled }}>
  {#snippet child({ props: itemProps })}
    <div
      {...rest}
      {...itemProps}
      class={[
        'collapse border-base-300 bg-base-100 border',
        open ? 'collapse-open' : 'collapse-close',
        collapseVariant[accordion.variant()],
        accordion.joined() && 'join-item',
        className,
      ]}
    >
  <Accordion.Header level={accordion.headingLevel()}>
    {#snippet child({ props })}
      {@const { role: _role, 'aria-level': _level, ...headerProps } = props}
      <svelte:element
        this={`h${accordion.headingLevel()}`}
        {...headerProps}
        class="collapse-title p-0 text-base font-medium"
      >
        <Accordion.Trigger id={triggerId}>
          {#snippet child({ props: triggerProps })}
            <button
              {...triggerProps}
              aria-controls={contentId}
              {...locked ? { 'aria-disabled': 'true' } : {}}
              class="w-full cursor-pointer px-4 py-4 pe-12 text-start disabled:cursor-not-allowed disabled:opacity-60"
            >
              {#if typeof title === 'string'}{title}{:else}{@render title()}{/if}
            </button>
          {/snippet}
        </Accordion.Trigger>
      </svelte:element>
    {/snippet}
  </Accordion.Header>
  <Accordion.Content
    id={contentId}
    role="region"
    aria-labelledby={triggerId}
    hiddenUntilFound={accordion.searchable()}
    class={['collapse-content', contentClass]}
  >
    {@render children()}
  </Accordion.Content>
    </div>
  {/snippet}
</Accordion.Item>
