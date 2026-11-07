<!-- @component
An icon-only button or link whose accessible name is a required `label`, shown as a tooltip on hover and focus.
-->
<!--
  IconButton — an icon-only button or link (close ×, kebab ⋮, edit ✎, a
  toolbar's buttons). An icon has no name of its own, so `label` is required:
  it is the control's `aria-label`, and, unless `tooltip={false}`, it is also
  shown on hover and keyboard focus, so a sighted pointer user gets the name
  too. The naming rule itself (the hidden icon, the 24×24 minimum target, the
  link form) lives in `IconButtonCore`; this file adds the tooltip.

  The tooltip is the visual counterpart of `aria-label`, not a description:
  bits-ui's trigger wires `aria-describedby` to its content, which would
  announce the name twice ("Close, Close"), so that one attribute is dropped
  from the trigger props. Every other trigger prop (focus, pointer and Escape
  handling) is kept, and a caller's handler of the same name runs first.

  Disabled with a tooltip, the control is `aria-disabled` rather than
  `disabled`, so it stays focusable and its name discoverable on hover; its
  activation is swallowed.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import IconButtonCore from './IconButtonCore.svelte';
  import Tooltip from './Tooltip.svelte';

  interface Props extends Omit<ComponentProps<typeof IconButtonCore>, 'focusableWhenDisabled'> {
    /**
     * Show `label` as a tooltip on hover and focus.
     * @defaultValue `true`
     */
    tooltip?: boolean | undefined;
    /**
     * Preferred side of the tooltip.
     * @defaultValue `'top'`
     */
    tooltipSide?: 'top' | 'right' | 'bottom' | 'left' | undefined;
  }

  let { tooltip = true, tooltipSide = 'top', ...rest }: Props = $props();

  /**
   * The trigger's props merged under the caller's: `aria-describedby` dropped
   * (the tooltip repeats the name, it does not describe it), and for an event
   * handler both have, both run, the caller's first.
   */
  const merge = (triggerProps: Record<string, unknown>): Record<string, unknown> => {
    const { 'aria-describedby': _describedBy, ...kept } = triggerProps;
    const merged: Record<string, unknown> = { ...kept };
    for (const [key, own] of Object.entries(rest)) {
      const theirs = kept[key];
      merged[key] =
        key.startsWith('on') && typeof own === 'function' && typeof theirs === 'function'
          ? (event: Event) => {
              own(event);
              theirs(event);
            }
          : own;
    }
    return merged;
  };
</script>

{#if tooltip}
  <Tooltip text={rest.label} side={tooltipSide}>
    {#snippet children({ props })}
      <IconButtonCore
        {...merge(props)}
        label={rest.label}
        icon={rest.icon}
        focusableWhenDisabled
      />
    {/snippet}
  </Tooltip>
{:else}
  <IconButtonCore {...rest} />
{/if}
