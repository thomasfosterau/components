<!-- @component
One row of a list: leading content, a headline with an overline and supporting text, and trailing content (a value, a badge, a chevron or a control). The whole row can be a link or a button.
-->
<!--
  ListRow — the general-purpose row (Compose's `ListItem`, libadwaita's
  `AdwActionRow`): `leading`, then `overline` / `headline` / `supporting`,
  then `trailing`. Inside a `ListGroup` it renders its own `<li>` and takes
  the group's padding; outside one it renders only the row body, so it can
  sit in `ItemList`'s item (`LinkListItem` is built on it).

  ARIA contract, by kind of row:
  - `href`: the row is one `<a>` (resolved through the components context,
    `aria-current="page"` when the context says it is the current page).
    Its name is the headline and the trailing content (`aria-labelledby`),
    so "Units › Metric" reads "Units Metric"; `supporting` is its
    description (`aria-describedby`). A chevron is drawn, `aria-hidden`.
  - `onclick` (no `href`): the row is one `<button type="button">`, named
    and described the same way. `tone="error"` colours a destructive row
    ("Delete account"); the headline's verb carries the meaning, not the
    colour.
  - Neither: a control row. The row is not interactive itself; the
    control in `trailing` is the one Tab stop, and the snippet receives
    `labelledBy` (the headline's id) and `describedBy` (the supporting
    text's id) so it names itself after the row:
    `<input type="checkbox" role="switch" aria-labelledby={labelledBy} …>`.
    A click anywhere on the row's text forwards to the control (a checkbox,
    switch, radio or button is clicked; anything else is focused), so the
    hit target is the whole row, as in SwiftUI and libadwaita.
  - A link or button row never holds a second interactive element: its
    `trailing` is decoration and value text, and badges in it need
    `VisuallyHidden` text if their meaning is not in the name. A focusable
    element in a link or button row's `trailing` logs a console warning.
  - `disabled`: `aria-disabled="true"` on the link or button, which stays
    focusable but does nothing, at reduced opacity.

  An expander row (libadwaita's `AdwExpanderRow`) is a pattern, not a
  component: a control row whose `children` holds a `Disclosure`.
-->
<script lang="ts">
  import { ChevronRight } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { getListGroupStyle, type ListGroupVariant } from './list-group.ts';

  /** What a row hands its `trailing` snippet, so a control can name itself after the row. */
  interface ListRowControl {
    /** The headline's id, for the control's `aria-labelledby`. */
    readonly labelledBy: string;
    /** The supporting text's id, for `aria-describedby`; `undefined` without one. */
    readonly describedBy: string | undefined;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'onclick' | 'children'> {
    /** The row's main text, and its name. */
    headline: string | Snippet<[]>;
    /** A small line above the headline. */
    overline?: string | undefined;
    /** A line of detail under the headline, and the row's description. */
    supporting?: string | Snippet<[]> | undefined;
    /** An icon, avatar or image before the text. */
    leading?: Snippet<[]> | undefined;
    /** A value, badge or control after the text. */
    trailing?: Snippet<[ListRowControl]> | undefined;
    /** Make the whole row a link; resolved through the components context. */
    href?: string | undefined;
    /** Make the whole row a button (when there is no `href`). */
    onclick?: ((event: MouseEvent) => void) | undefined;
    /**
     * Draw a chevron at the end.
     * @defaultValue `true` when `href` is set
     */
    chevron?: boolean | undefined;
    /** `'error'` for a destructive row ("Delete account"). */
    tone?: 'error' | undefined;
    /** Make a link or button row inert (`aria-disabled`). */
    disabled?: boolean | undefined;
    /** More content under the supporting text: meta, badges, a `Disclosure`. */
    children?: Snippet<[]> | undefined;
  }

  let {
    headline,
    overline,
    supporting,
    leading,
    trailing,
    href,
    onclick,
    chevron,
    tone,
    disabled = false,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const headlineId = `${uid}-headline`;
  const supportingId = `${uid}-supporting`;
  const trailingId = `${uid}-trailing`;

  const context = getComponentsContext();
  const group = getListGroupStyle();

  const tag = $derived(href === undefined ? (onclick === undefined ? 'div' : 'button') : 'a');
  const interactive = $derived(tag !== 'div');
  /** Inside a link or a button only phrasing content is allowed. */
  const box = $derived(interactive ? 'span' : 'div');
  const resolved = $derived(href === undefined ? undefined : context.href(href));
  const current = $derived(resolved !== undefined && context.isCurrent(resolved));
  const showChevron = $derived(chevron ?? href !== undefined);
  const describedBy = $derived(supporting === undefined ? undefined : supportingId);
  const labelledBy = $derived(trailing === undefined ? headlineId : `${headlineId} ${trailingId}`);

  const padding: Record<ListGroupVariant, string> = {
    inset: 'min-h-12 px-4 py-3',
    plain: 'min-h-12 py-3',
  };

  const FOCUSABLE =
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

  let trailingBox: HTMLElement | undefined = $state();

  function activate(event: MouseEvent): void {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onclick?.(event);
  }

  /** A control row: a click on the text works the trailing control. */
  function forward(event: MouseEvent): void {
    if (event.target instanceof Element && event.target.closest(FOCUSABLE) !== null) return;
    const control = trailingBox?.querySelector(FOCUSABLE);
    if (!(control instanceof HTMLElement)) return;
    const toggles =
      control instanceof HTMLButtonElement ||
      (control instanceof HTMLInputElement && ['checkbox', 'radio'].includes(control.type)) ||
      control.getAttribute('role') === 'switch';
    if (toggles) control.click();
    else control.focus();
  }

  const forwardClicks: Attachment<HTMLElement> = (node) => {
    node.addEventListener('click', forward);
    return () => node.removeEventListener('click', forward);
  };

  $effect(() => {
    if (!interactive || trailingBox?.querySelector(FOCUSABLE) == null) return;
    // A caller's markup bug that breaks the row for keyboard and screen
    // reader users: it has to reach the console the developer is looking at.
    console.warn(
      '[ListRow] A link or button row holds a focusable element in `trailing`. ' +
        'Interactive elements cannot nest: drop `href`/`onclick` to make a control row.',
    );
  });
</script>

{#snippet text(value: string | Snippet<[]>)}
  {#if typeof value === 'string'}{value}{:else}{@render value()}{/if}
{/snippet}

{#snippet body()}
  <svelte:element
    this={tag}
    {...rest}
    href={tag === 'a' ? resolved : undefined}
    type={tag === 'button' ? 'button' : undefined}
    aria-current={current ? 'page' : undefined}
    aria-disabled={interactive && disabled ? 'true' : undefined}
    aria-labelledby={interactive ? labelledBy : undefined}
    aria-describedby={interactive ? describedBy : undefined}
    onclick={interactive ? activate : undefined}
    class={[
      'flex items-center gap-3 text-start',
      group !== undefined && padding[group().variant],
      interactive && 'hover:bg-base-200 w-full focus-visible:outline-offset-[-2px]',
      interactive && !disabled && 'cursor-pointer',
      tone === 'error' && 'text-error',
      disabled && 'cursor-not-allowed opacity-50',
      className,
    ]}
  >
    {#if leading}
      <svelte:element this={box} class="flex shrink-0 items-center">{@render leading()}</svelte:element>
    {/if}
    <svelte:element
      this={box}
      class={['flex min-w-0 flex-1 flex-col gap-1', !interactive && trailing && !disabled && 'cursor-pointer']}
      {@attach !interactive && trailing !== undefined && !disabled && forwardClicks}
    >
      {#if overline !== undefined}
        <span class="text-base-content/60 text-xs uppercase">{overline}</span>
      {/if}
      <svelte:element this={box} id={headlineId} class="font-medium">{@render text(headline)}</svelte:element>
      {#if supporting !== undefined}
        <svelte:element this={box} id={supportingId} class="text-base-content/70 text-sm">
          {@render text(supporting)}
        </svelte:element>
      {/if}
      {@render children?.()}
    </svelte:element>
    {#if trailing}
      <svelte:element this={box} bind:this={trailingBox} id={trailingId} class="flex shrink-0 items-center gap-2">
        {@render trailing({ labelledBy: headlineId, describedBy })}
      </svelte:element>
    {/if}
    {#if showChevron}
      <ChevronRight class="size-4 shrink-0 opacity-60" aria-hidden="true" />
    {/if}
  </svelte:element>
{/snippet}

{#if group === undefined}
  {@render body()}
{:else}
  <li>{@render body()}</li>
{/if}
