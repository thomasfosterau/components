<!-- @component
A compact pill control: an assist chip (a contextual action), a filter chip (a toggle with a check) or a suggestion chip (a quick reply). Not `Chip`, which is a colour swatch beside a code.
-->
<!--
  ActionChip — presets over `Button`, `LinkButton` and `ToggleButton` in the
  `pill` shape. Assist and suggestion chips are native buttons (an assist
  chip with `href` is a link); a filter chip is an `aria-pressed` toggle
  whose check appears when on, so state is not colour alone and its name
  never changes. Dynamically shown suggestions belong in the caller's
  polite live region.
-->
<script lang="ts">
  import { Check } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Button from './Button.svelte';
  import LinkButton from './LinkButton.svelte';
  import ToggleButton from './ToggleButton.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /**
     * Assist: a contextual action. Filter: a toggle. Suggestion: a quick choice.
     * @defaultValue `'assist'`
     */
    kind?: 'assist' | 'filter' | 'suggestion' | undefined;
    /** The chip's text; its accessible name. */
    children: Snippet<[]>;
    /** Leading icon. Decorative. */
    icon?: Snippet<[]> | undefined;
    /** Whether a filter chip is on. Bindable. */
    selected?: boolean | undefined;
    /** Called with a filter chip's next state. */
    onSelectedChange?: ((selected: boolean) => void) | undefined;
    /** An assist chip that navigates; resolved through the components context. */
    href?: string | undefined;
    /**
     * A shadow, for a chip over imagery or a busy surface.
     * @defaultValue `false`
     */
    elevated?: boolean | undefined;
    /** @defaultValue `'sm'` */
    size?: 'sm' | 'md' | undefined;
    /** @defaultValue `false` */
    disabled?: boolean | undefined;
  }

  let {
    kind = 'assist',
    children,
    icon,
    selected = $bindable(false),
    onSelectedChange,
    href,
    elevated = false,
    size = 'sm',
    disabled = false,
    class: className,
    ...rest
  }: Props = $props();

  const classes = $derived(['font-normal', elevated && 'shadow-sm', className]);
</script>

{#snippet check()}<Check class="size-4" aria-hidden="true" />{/snippet}

{#if kind === 'filter'}
  <ToggleButton
    {...rest}
    bind:pressed={selected}
    {...onSelectedChange === undefined ? {} : { onPressedChange: onSelectedChange }}
    shape="pill"
    {size}
    {disabled}
    {icon}
    pressedIcon={check}
    tone="primary"
    variant="outline"
    class={classes}
  >
    {@render children()}
  </ToggleButton>
{:else if href !== undefined}
  <LinkButton {...rest} {href} shape="pill" {size} {disabled} {icon} variant="outline" class={classes}>
    {@render children()}
  </LinkButton>
{:else}
  <Button
    {...rest}
    shape="pill"
    {size}
    {disabled}
    {icon}
    variant={kind === 'suggestion' ? 'ghost' : 'outline'}
    class={[kind === 'suggestion' && 'border-base-300 border', classes]}
  >
    {@render children()}
  </Button>
{/if}
