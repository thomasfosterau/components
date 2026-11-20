<!-- @component
The APG window-splitter handle `Splitter` and `ListDetailLayout` share; internal, not exported.
-->
<!--
  SplitterHandle — one implementation of the window splitter's handle, so
  `Splitter` and `ListDetailLayout`'s `resizable` divider cannot drift on
  keys, drag or ARIA. The owner lays the panes out; this is the separator
  between them and the arithmetic that turns keys and a pointer into a
  leading-pane size in percent of `container()`.

  ARIA contract: `role="separator"`, focusable, named by `label`, with
  `aria-valuenow` (rounded), `aria-valuemin` (`min`, or `0` when
  `collapsible`), `aria-valuemax` and `aria-controls`. Its `aria-orientation`
  is the opposite of the layout's: panes side by side are split by a
  vertical line.

  Keys: ←/→ (side by side) or ↑/↓ (stacked) by `step`, mirrored under a
  computed `direction: rtl`; Home / End to `min` / `max`; Enter, when
  `collapsible`, collapses to 0 and restores. A drag captures the pointer
  and moves `value` live; `onCommit` fires once per key press or drag that
  changed it.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  type Orientation = 'horizontal' | 'vertical';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'onkeydown'> {
    /** The leading pane's size, in percent of `container()`. Bindable. */
    value: number;
    min: number;
    max: number;
    step: number;
    collapsible: boolean;
    /** The layout's: `'horizontal'` is panes side by side. */
    orientation: Orientation;
    /** The handle's accessible name. */
    label: string;
    /** The leading pane's id. */
    controls: string;
    /** The element whose box a drag measures against. */
    container: () => HTMLElement | undefined;
    onCommit?: ((size: number) => void) | undefined;
  }

  let {
    value = $bindable(),
    min,
    max,
    step,
    collapsible,
    orientation,
    label,
    controls,
    container,
    onCommit,
    class: className,
    ...rest
  }: Props = $props();

  const handleClasses: Record<Orientation, string> = {
    horizontal: 'cursor-col-resize before:inset-x-[-4px] before:inset-y-0',
    vertical: 'cursor-row-resize before:inset-x-0 before:inset-y-[-4px]',
  };
  const separatorOrientation: Record<Orientation, Orientation> = {
    horizontal: 'vertical',
    vertical: 'horizontal',
  };
  const keys: Record<Orientation, { readonly shrink: string; readonly grow: string }> = {
    horizontal: { shrink: 'ArrowLeft', grow: 'ArrowRight' },
    vertical: { shrink: 'ArrowUp', grow: 'ArrowDown' },
  };

  /** The size Enter restores after a collapse. */
  let restoreTo = 50;
  /** The pointer drag in progress: its id and the size it started from. */
  let drag: { readonly pointerId: number; readonly from: number } | undefined;

  const clamp = (size: number): number => Math.min(max, Math.max(min, size));
  const collapsed = $derived(collapsible && value === 0);
  const current = $derived(collapsed ? 0 : clamp(value));

  const rtl = (): boolean => {
    const box = container();
    return orientation === 'horizontal' && box !== undefined && getComputedStyle(box).direction === 'rtl';
  };

  const settle = (next: number): void => {
    if (next === current) return;
    value = next;
    onCommit?.(next);
  };

  /** One arrow press: from collapsed, growing opens at `min`. */
  const nudge = (direction: 1 | -1): void => {
    if (collapsed) {
      if (direction === 1) settle(min);
      return;
    }
    settle(clamp(current + direction * step));
  };

  const onkeydown = (event: KeyboardEvent): void => {
    const { shrink, grow } = keys[orientation];
    const flip = rtl() ? -1 : 1;
    if (event.key === shrink) nudge(flip === 1 ? -1 : 1);
    else if (event.key === grow) nudge(flip === 1 ? 1 : -1);
    else if (event.key === 'Home') settle(min);
    else if (event.key === 'End') settle(max);
    else if (event.key === 'Enter' && collapsible) {
      if (collapsed) settle(clamp(restoreTo));
      else {
        restoreTo = current;
        settle(0);
      }
    } else return;
    event.preventDefault();
  };

  /** The leading size the pointer at this event stands for. */
  const sizeAt = (event: PointerEvent): number => {
    const box = container();
    if (box === undefined) return current;
    const rect = box.getBoundingClientRect();
    if (orientation === 'vertical') return clamp(((event.clientY - rect.top) / rect.height) * 100);
    const offset = rtl() ? rect.right - event.clientX : event.clientX - rect.left;
    return clamp((offset / rect.width) * 100);
  };

  const onpointerdown = (event: PointerEvent): void => {
    if (event.button !== 0 || !(event.currentTarget instanceof HTMLElement)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag = { pointerId: event.pointerId, from: current };
    event.preventDefault();
  };

  const onpointermove = (event: PointerEvent): void => {
    if (drag?.pointerId !== event.pointerId) return;
    value = sizeAt(event);
  };

  const stopDrag = (event: PointerEvent): void => {
    if (drag?.pointerId !== event.pointerId) return;
    const { from } = drag;
    drag = undefined;
    if (current !== from) onCommit?.(current);
  };
</script>

<!-- A focusable separator is a widget (ARIA 1.2, the APG window splitter);
     Svelte's role table only knows the static, non-interactive one. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  {...rest}
  role="separator"
  tabindex="0"
  aria-label={label}
  aria-orientation={separatorOrientation[orientation]}
  aria-valuenow={Math.round(current)}
  aria-valuemin={collapsible ? 0 : min}
  aria-valuemax={max}
  aria-controls={controls}
  class={[
    'relative touch-none bg-base-300 before:absolute before:content-[""] hover:bg-primary focus-visible:bg-primary focus-visible:outline-none',
    handleClasses[orientation],
    className,
  ]}
  {onkeydown}
  {onpointerdown}
  {onpointermove}
  onpointerup={stopDrag}
  onpointercancel={stopDrag}
></div>
