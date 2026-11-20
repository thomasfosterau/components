<!-- @component
An inset, rounded, divided group of `ListRow`s with an optional heading, description and footer: a settings screen's section.
-->
<!--
  ListGroup — the iOS Settings / libadwaita preferences group: a heading, a
  line of explanation, a box of rows and a footnote.

  ARIA contract:
  - A `<section>` named by its heading (`aria-labelledby`), so a titled
    group is a `region` landmark a reader can jump to; `description` is its
    `aria-describedby`. Without a `title` it is a plain, unnamed section.
  - The rows are a `<ul role="list">` of the `ListRow`s' own `<li>`s. The
    explicit role restores the list semantics Safari drops from a list
    styled `list-style: none`.
  - `footer` is plain text after the list, not part of the list.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { HeadingLevel } from '../ui/tones.ts';
  import { setListGroupStyle, type ListGroupVariant } from './list-group.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
    /** The group's heading, which names the section. */
    title?: string | undefined;
    /**
     * The heading's level.
     * @defaultValue `2`
     */
    level?: HeadingLevel | undefined;
    /** A line under the heading, which describes the section. */
    description?: string | undefined;
    /** A footnote after the rows. */
    footer?: string | Snippet<[]> | undefined;
    /**
     * An inset, rounded, bordered box (`'inset'`), or rows divided by rules
     * alone (`'plain'`).
     * @defaultValue `'inset'`
     */
    variant?: ListGroupVariant | undefined;
    /** The `ListRow`s. */
    children: Snippet<[]>;
  }

  let {
    title,
    level = 2,
    description,
    footer,
    variant = 'inset',
    children,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const titleId = `${uid}-title`;
  const descriptionId = `${uid}-description`;

  setListGroupStyle(() => ({ variant }));

  const listClasses: Record<ListGroupVariant, string> = {
    inset: 'rounded-box bg-base-100 border-base-300 divide-base-300 divide-y border',
    plain: 'divide-base-300 divide-y',
  };
</script>

<section
  {...rest}
  aria-labelledby={title === undefined ? undefined : titleId}
  aria-describedby={description === undefined ? undefined : descriptionId}
  class={['flex flex-col gap-1', className]}
>
  {#if title !== undefined}
    <svelte:element this={`h${level}`} id={titleId} class="text-base-content/70 px-4 text-sm font-medium">
      {title}
    </svelte:element>
  {/if}
  {#if description !== undefined}
    <p id={descriptionId} class="text-base-content/60 px-4 text-sm">{description}</p>
  {/if}
  <!-- The role is not redundant: Safari drops a `list-style: none` list's semantics without it. -->
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <ul role="list" class={listClasses[variant]}>
    {@render children()}
  </ul>
  {#if footer !== undefined}
    <div class="text-base-content/60 px-4 text-xs">
      {#if typeof footer === 'string'}{footer}{:else}{@render footer()}{/if}
    </div>
  {/if}
</section>
