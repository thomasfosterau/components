<!-- @component
A button that stays pressed (`aria-pressed`), on bits-ui `Toggle`.
-->
<!--
  ToggleButton — "Bold", "Show frost dates", "Mute", "Favourite": a button
  whose state persists between presses. Not a `fields/Toggle` (a switch: a
  setting that takes effect, `role="switch"`), not a `Checkbox` (a form
  value).

  ARIA contract: bits-ui's `aria-pressed`, and Space / Enter both toggle.
  The accessible name never changes with state: "Mute" stays "Mute" when
  pressed, because the state is `aria-pressed`'s job. An icon-only button
  must have a `label` (the types enforce it), read as visually hidden text;
  `tooltip` opts in to showing it on hover and focus. `data-state="on" |
  "off"` is a supported styling hook. Pressed is not colour alone: see
  `toggle-classes.ts`; `pressedIcon` adds a shape change.
-->
<script lang="ts">
  import { Toggle } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { toggleClasses } from './toggle-classes.ts';
  import { buttonSize, type ButtonVariant, type Size, type Tone } from './tones.ts';
  import Tooltip from './Tooltip.svelte';

  type Props = Omit<HTMLButtonAttributes, 'type' | 'children'> & {
    /** Whether the button is pressed. Bindable. */
    pressed?: boolean | undefined;
    /** Called with the next state after a press. */
    onPressedChange?: ((pressed: boolean) => void) | undefined;
    /**
     * Colour while pressed.
     * @defaultValue `'neutral'`
     */
    tone?: Tone | undefined;
    /**
     * Look while not pressed.
     * @defaultValue `'ghost'`
     */
    variant?: ButtonVariant | undefined;
    /** @defaultValue `'md'` */
    size?: Size | undefined;
    /** Leading icon. */
    icon?: Snippet<[]> | undefined;
    /** Icon shown in place of `icon` while pressed (an outlined star becomes a filled one). */
    pressedIcon?: Snippet<[]> | undefined;
    /**
     * Show the label in a tooltip on hover and focus (icon-only buttons).
     * @defaultValue `false`
     */
    tooltip?: boolean | undefined;
  } & (
      | {
          iconOnly?: false | undefined;
          label?: undefined;
          /** The button text; its accessible name. */
          children: Snippet<[]>;
        }
      | {
          /** Hide the text: only the icon shows, and `label` is the accessible name. */
          iconOnly: true;
          /** The accessible name of an icon-only button. Constant across states. */
          label: string;
          children?: undefined;
        }
    );

  let {
    pressed = $bindable(false),
    onPressedChange,
    tone = 'neutral',
    variant = 'ghost',
    size = 'md',
    icon,
    pressedIcon,
    tooltip = false,
    iconOnly = false,
    label,
    children,
    disabled,
    class: className,
    ...rest
  }: Props = $props();
</script>

{#snippet button(extra: Record<string, unknown>)}
  <Toggle.Root
    {...extra}
    bind:pressed
    {...onPressedChange === undefined ? {} : { onPressedChange }}
    {...disabled == null ? {} : { disabled }}
  >
    {#snippet child({ props, pressed: on })}
      <button
        {...rest}
        {...props}
        type="button"
        class={[
          'btn',
          buttonSize[size],
          toggleClasses(on, tone, variant),
          iconOnly && 'btn-square',
          className,
        ]}
      >
        {#if on && pressedIcon}{@render pressedIcon()}{:else if icon}{@render icon()}{/if}
        {#if iconOnly}<span class="sr-only">{label}</span>{:else}{@render children?.()}{/if}
      </button>
    {/snippet}
  </Toggle.Root>
{/snippet}

{#if tooltip && label !== undefined}
  <Tooltip text={label}>
    {#snippet children({ props })}{@render button(props)}{/snippet}
  </Tooltip>
{:else}
  {@render button({})}
{/if}
