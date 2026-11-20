<!-- @component
A floating action button that opens a short, labelled list of related actions (a speed dial).
-->
<!--
  An APG disclosure, not a menu: the toggle's `aria-expanded` reveals a
  `role="group"` of ordinary buttons and links in Tab order; Escape closes
  and returns focus, as does focus leaving. Open state is a prop, never
  `:focus-within`, so daisyUI's `fab` classes are not used.
-->
<script lang="ts">
  import { Plus } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { fabPosition, fabSize, type FabMenuItem, type FabPosition, type FabSize } from './fab.ts';
  import { buttonTone, type Tone } from './tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The actions, nearest the toggle first. */
    items: readonly FabMenuItem[];
    /**
     * The toggle's accessible name, and the group's.
     * @defaultValue `'Actions'`
     */
    label?: string | undefined;
    /** The toggle's icon; a plus that turns to a cross when omitted. */
    icon?: Snippet<[]> | undefined;
    /**
     * Whether the actions are shown. Bindable.
     * @defaultValue `false`
     */
    open?: boolean | undefined;
    /**
     * The toggle's semantic colour.
     * @defaultValue `'primary'`
     */
    tone?: Tone | undefined;
    /**
     * The toggle's size step.
     * @defaultValue `'md'`
     */
    size?: FabSize | undefined;
    /**
     * Where it sits; `'inline'` keeps it in the flow.
     * @defaultValue `'end'`
     */
    position?: FabPosition | undefined;
  }

  let {
    items,
    label = 'Actions',
    icon,
    open = $bindable(false),
    tone = 'primary',
    size = 'md',
    position = 'end',
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const groupId = `${uid}-actions`;
  const context = getComponentsContext();
  let toggle: HTMLButtonElement | undefined = $state();

  function close(returnFocus: boolean): void {
    open = false;
    if (returnFocus) toggle?.focus();
  }

  function onkeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && open) {
      event.stopPropagation();
      close(true);
    }
  }

  function onfocusout(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !(event.currentTarget as HTMLElement).contains(next)) open = false;
  }

  const itemClass = 'btn bg-base-100 border-base-300 rounded-full shadow-md';
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  {...rest}
  class={['flex flex-col-reverse items-end gap-3', fabPosition[position], className]}
  data-fab
  {onkeydown}
  {onfocusout}
>
  <button
    bind:this={toggle}
    type="button"
    class={['btn btn-circle shadow-lg', buttonTone[tone], fabSize[size]]}
    aria-label={label}
    aria-expanded={open}
    aria-controls={groupId}
    onclick={() => (open = !open)}
  >
    {#if icon}
      <span class="inline-flex" aria-hidden="true">{@render icon()}</span>
    {:else}
      <Plus class={['size-6 motion-safe:transition-transform', open && 'rotate-45']} aria-hidden="true" />
    {/if}
  </button>
  <div id={groupId} role="group" aria-label={label} class="flex flex-col-reverse items-end gap-2" hidden={!open}>
    {#each items as item (item.label)}
      {#if item.href !== undefined}
        <a href={context.href(item.href)} class={itemClass} onclick={() => close(false)}>
          {#if item.icon}<span class="inline-flex" aria-hidden="true">{@render item.icon()}</span>{/if}
          {item.label}
        </a>
      {:else}
        <button
          type="button"
          class={itemClass}
          onclick={() => {
            close(true);
            item.onSelect?.();
          }}
        >
          {#if item.icon}<span class="inline-flex" aria-hidden="true">{@render item.icon()}</span>{/if}
          {item.label}
        </button>
      {/if}
    {/each}
  </div>
</div>
