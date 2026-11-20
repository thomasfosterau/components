<!-- @component
A default action joined to a menu of alternatives: "Save ▾ (Save as draft, Save and publish)".
-->
<!--
  SplitButton — two buttons in one daisyUI `join`. There is no APG pattern;
  this is the shape Fluent, Compose and Primer share.

  ARIA contract: a `role="group"` with no name of its own around two Tab
  stops. The main part is a `Button` (or a `LinkButton` with `href`) named
  by `children`, `aria-busy` while `loading`. The chevron is an APG Menu
  Button on bits-ui's `DropdownMenu` (`aria-haspopup="menu"`,
  `aria-expanded`, `aria-controls`), named by `menuLabel`, which should say
  what it offers ("More save options"). Enter, Space or ↓ opens the menu on
  its first item; Escape or a selection closes it and returns focus to the
  chevron. `primaryDisabled` disables only the main part, so the
  alternatives stay reachable.

  The menu's items are the same `MenuItem`s a `DropdownMenu` takes, so this
  component reaches bits-ui's dropdown runtime: keep it off pages every
  visitor loads.
-->
<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Button from './Button.svelte';
  import DropdownMenu from './DropdownMenu.svelte';
  import LinkButton from './LinkButton.svelte';
  import {
    buttonSize,
    buttonTone,
    buttonVariant,
    type ButtonVariant,
    type Size,
    type Tone,
  } from './tones.ts';

  /** Where the menu opens against the chevron. */
  type Placement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onclick' | 'children'> {
    /** The default action's text and accessible name. */
    children: Snippet<[]>;
    /** An icon before the main part's text. */
    icon?: Snippet<[]> | undefined;
    /** Runs the default action. */
    onclick?: ((event: MouseEvent) => void) | undefined;
    /** Make the default action navigation: the main part becomes a `LinkButton`. */
    href?: string | undefined;
    /** The alternatives, as `MenuItem`s. */
    menu: Snippet<[]>;
    /**
     * The chevron's and the menu's accessible name; say what it holds ("More save options").
     * @defaultValue `'More options'`
     */
    menuLabel?: string | undefined;
    /** Whether the menu is open. Bindable. */
    open?: boolean | undefined;
    /** Semantic colour of both parts. */
    tone?: Tone | undefined;
    /**
     * daisyUI button style of both parts.
     * @defaultValue `'solid'`
     */
    variant?: ButtonVariant | undefined;
    /**
     * daisyUI size step of both parts.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /** Disables both parts. */
    disabled?: boolean | undefined;
    /** Disables only the main part, leaving the alternatives available. */
    primaryDisabled?: boolean | undefined;
    /** A spinner on the main part, which is then `aria-busy` and disabled. */
    loading?: boolean | undefined;
    /**
     * Where the menu opens.
     * @defaultValue `'bottom-end'`
     */
    placement?: Placement | undefined;
  }

  let {
    children,
    icon,
    onclick,
    href,
    menu,
    menuLabel = 'More options',
    open = $bindable(false),
    tone,
    variant = 'solid',
    size = 'md',
    disabled = false,
    primaryDisabled = false,
    loading = false,
    placement = 'bottom-end',
    class: className,
    ...rest
  }: Props = $props();

  const side = $derived(placement.startsWith('top') ? 'top' : 'bottom');
  const align = $derived(placement.endsWith('start') ? 'start' : 'end');
  const shared = $derived({ tone, variant, size });
</script>

<div {...rest} role="group" class={['join', className]}>
  {#if href !== undefined}
    <LinkButton {...shared} {href} {icon} disabled={disabled || primaryDisabled} class="join-item">
      {@render children()}
    </LinkButton>
  {:else}
    <Button
      {...shared}
      {icon}
      {loading}
      {onclick}
      disabled={disabled || primaryDisabled}
      class="join-item"
    >
      {@render children()}
    </Button>
  {/if}
  <DropdownMenu label={menuLabel} bind:open {side} {align}>
    {#snippet trigger({ props })}
      <button
        {...props}
        type="button"
        aria-label={menuLabel}
        {disabled}
        class={[
          'btn join-item btn-square border-s-base-content/20 border-s',
          tone !== undefined && buttonTone[tone],
          buttonVariant[variant],
          buttonSize[size],
        ]}
      >
        <ChevronDown
          class={['size-4 motion-safe:transition-transform', open && 'rotate-180']}
          aria-hidden="true"
        />
      </button>
    {/snippet}
    {@render menu()}
  </DropdownMenu>
</div>
