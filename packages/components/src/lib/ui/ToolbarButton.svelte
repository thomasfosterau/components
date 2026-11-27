<!-- @component
A button inside a `Toolbar`: one of its roving-focus controls, wearing the library's `Button`.
-->
<!--
  ToolbarButton — rendered through bits-ui `Toolbar.Button`'s `child`
  snippet onto `Button`, so the button look and the `loading` contract stay
  one implementation. `iconOnly` hides the text visually; it stays the
  accessible name (never `title`). As a `Toolbar` overflow item it takes the
  attributes `item` is given by spread (`toolbar-stop.ts`).
-->
<script lang="ts">
  import { Toolbar } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import Button from './Button.svelte';
  import { getToolbarStop, overflowControl } from './toolbar-stop.ts';
  import type { ButtonVariant, Size, Tone } from './tones.ts';

  interface Props extends Omit<HTMLButtonAttributes, 'type' | 'children'> {
    /** Semantic colour. */
    tone?: Tone | undefined;
    /** @defaultValue `'ghost'` */
    variant?: ButtonVariant | undefined;
    /** @defaultValue `'sm'` */
    size?: Size | undefined;
    /** Leading icon. */
    icon?: Snippet<[]> | undefined;
    /** Hide the text visually; it remains the accessible name. */
    iconOnly?: boolean | undefined;
    /** The button text; its accessible name. */
    children: Snippet<[]>;
  }

  let {
    tone,
    variant = 'ghost',
    size = 'sm',
    icon,
    iconOnly = false,
    children,
    disabled,
    class: className,
    ...rest
  }: Props = $props();

  const stop = getToolbarStop();
</script>

<Toolbar.Button {...disabled == null ? {} : { disabled }}>
  {#snippet child({ props })}
    <Button
      {...rest}
      {...props}
      {...overflowControl(stop, rest, props)}
      {tone}
      {variant}
      {size}
      {icon}
      class={[iconOnly && 'btn-square', className]}
    >
      {#if iconOnly}<span class="sr-only">{@render children()}</span>{:else}{@render children()}{/if}
    </Button>
  {/snippet}
</Toolbar.Button>
