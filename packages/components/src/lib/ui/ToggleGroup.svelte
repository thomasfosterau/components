<!-- @component
A set of toggle buttons answering one question, exclusively or independently, on bits-ui `ToggleGroup`.
-->
<!--
  ToggleGroup — a segmented control (`type="single"`: Grid | List | Map,
  Day | Week | Month) or a set of independent toggles (`type="multiple"`:
  B / I / U, "Show: Annuals Perennials Bulbs"), as daisyUI `btn`s in a
  `join`. One Tab stop, arrow keys between items (bits-ui's roving focus).

  ARIA contract:
  - `type="multiple"`: a `role="group"` of buttons with `aria-pressed`;
    arrows move focus, Space / Enter toggles.
  - `type="single"`: bits-ui makes the items `role="radio"` with
    `aria-checked` but keeps its root a `group`; radios belong in a
    `radiogroup`, so the root's role is overridden. As in an APG radio
    group, arrows move focus AND select (bits-ui only moves focus, so the
    root completes the move), and Tab into the group lands on the checked
    item, not the first. With `required`, pressing the checked item does
    nothing, so one item always stays selected.
  - Named by `label` (`aria-label`) or, inside a `FormField`, by the label
    element (`labelId` → `aria-labelledby`); `describedBy` and `invalid` as
    every field control. An item's name never changes with state; an
    icon-only item reads its `label` as visually hidden text, and
    `tooltip` opts in to showing it on hover and focus.
  - With `name`, the selection posts with a form: one hidden input per
    selected value (bits-ui's group has no hidden inputs of its own).
-->
<script lang="ts" generics="V extends string">
  import { Check } from '@lucide/svelte';
  import { ToggleGroup } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { toggleClasses, toggleSetters, type ToggleGroupItem } from './toggle-classes.ts';
  import { buttonSize, type ButtonVariant, type Size, type Tone } from './tones.ts';
  import Tooltip from './Tooltip.svelte';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'children'> & {
    items: readonly ToggleGroupItem<V>[];
    /** Accessible name of the group ("View", "Formatting"); omit when `labelId` names it. */
    label?: string | undefined;
    /** `FieldControl`: the visible label's id; the group is `aria-labelledby` it. */
    labelId?: string | undefined;
    /** `FieldControl`: space-separated ids for `aria-describedby`. */
    describedBy?: string | undefined;
    /** `FieldControl`: the field is in error. */
    invalid?: boolean | undefined;
    /** Posts the selection with a form: one hidden input per selected value. */
    name?: string | undefined;
    /** @defaultValue `'horizontal'` */
    orientation?: 'horizontal' | 'vertical' | undefined;
    /** @defaultValue `true` */
    loop?: boolean | undefined;
    /**
     * Colour of a pressed item.
     * @defaultValue `'primary'`
     */
    tone?: Tone | undefined;
    /**
     * Look of an unpressed item.
     * @defaultValue `'solid'`
     */
    variant?: ButtonVariant | undefined;
    /** @defaultValue `'md'` */
    size?: Size | undefined;
    /** Stretch to the container's width, items sharing it equally. */
    block?: boolean | undefined;
    /** A check mark (`aria-hidden`) on pressed items, a second non-colour cue. */
    showCheck?: boolean | undefined;
    /** Show icon-only items' labels in a tooltip on hover and focus. */
    tooltip?: boolean | undefined;
    disabled?: boolean | undefined;
    /** Per-item content in place of icon + label; the label stays the name unless you render it. */
    item?: Snippet<[ToggleGroupItem<V>, { pressed: boolean }]> | undefined;
  } & (
      | {
          type: 'single';
          /** The selected value, `''` for none. Bindable. */
          value?: V | '' | undefined;
          onValueChange?: ((value: V | '') => void) | undefined;
          /**
           * Keep one item selected: pressing the selected item does nothing.
           * @defaultValue `false`
           */
          required?: boolean | undefined;
        }
      | {
          type: 'multiple';
          /** The selected values. Bindable. */
          value?: readonly V[] | undefined;
          onValueChange?: ((value: V[]) => void) | undefined;
          /** `FieldControl`: accepted for the spread; a multiple group may be empty. */
          required?: boolean | undefined;
        }
    );

  let {
    type,
    items,
    value = $bindable(),
    onValueChange,
    required = false,
    label,
    labelId,
    describedBy = '',
    invalid = false,
    name,
    orientation = 'horizontal',
    loop = true,
    tone = 'primary',
    variant = 'solid',
    size = 'md',
    block = false,
    showCheck = false,
    tooltip = false,
    disabled = false,
    item: itemBody,
    class: className,
    ...rest
  }: Props = $props();

  const selected = $derived<readonly string[]>(
    value === undefined || value === '' ? [] : typeof value === 'string' ? [value] : value,
  );

  const setters = toggleSetters<V>({
    required: () => required,
    assign: (next) => (value = next),
    notify: () => onValueChange,
  });

  const MOVE_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

  /** Single mode: once bits-ui has moved focus, select what it moved to. */
  function selectFollowsFocus(event: KeyboardEvent): void {
    if (type !== 'single' || !MOVE_KEYS.has(event.key)) return;
    const focused = document.activeElement;
    if (!(focused instanceof HTMLElement)) return;
    const next = focused.dataset['value'];
    if (next !== undefined && next !== value && !focused.hasAttribute('data-disabled')) setters.single(next);
  }

  /** Single mode: Tab into the group lands on the checked item. */
  function focusChecked(event: FocusEvent): void {
    const root = event.currentTarget;
    if (type !== 'single' || !(root instanceof HTMLElement)) return;
    if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
    const checked = root.querySelector<HTMLElement>('[aria-checked="true"]');
    if (checked !== null && checked !== event.target) checked.focus();
  }
</script>

{#snippet root({ props }: { props: Record<string, unknown> })}
  <div
    {...props}
    {...rest}
    role={type === 'single' ? 'radiogroup' : 'group'}
    aria-label={labelId === undefined ? label : undefined}
    aria-labelledby={labelId}
    aria-describedby={describedBy === '' ? undefined : describedBy}
    aria-invalid={invalid ? 'true' : undefined}
    aria-required={type === 'single' && required ? 'true' : undefined}
    aria-orientation={orientation}
    onkeydown={selectFollowsFocus}
    onfocusin={focusChecked}
    class={['join', orientation === 'vertical' && 'join-vertical', block && 'flex w-full', className]}
  >
    {#each items as entry (entry.value)}
      {#if tooltip && entry.iconOnly}
        <Tooltip text={entry.label}>
          {#snippet children({ props: tip })}{@render itemButton(entry, tip)}{/snippet}
        </Tooltip>
      {:else}
        {@render itemButton(entry, {})}
      {/if}
    {/each}
  </div>
{/snippet}

{#snippet itemButton(entry: ToggleGroupItem<V>, extra: Record<string, unknown>)}
  <ToggleGroup.Item {...extra} value={entry.value} disabled={entry.disabled ?? false}>
    {#snippet child({ props, pressed })}
      <button
        {...props}
        type="button"
        class={[
          'btn join-item',
          buttonSize[size],
          toggleClasses(pressed, tone, variant),
          block && 'flex-1',
          entry.iconOnly && !block && 'btn-square',
        ]}
      >
        {#if itemBody}
          {@render itemBody(entry, { pressed })}
        {:else}
          {#if showCheck && pressed}<Check class="size-4" aria-hidden="true" />{/if}
          {@render entry.icon?.()}
          {#if entry.iconOnly}<span class="sr-only">{entry.label}</span>{:else}{entry.label}{/if}
        {/if}
      </button>
    {/snippet}
  </ToggleGroup.Item>
{/snippet}

{#if type === 'single'}
  <ToggleGroup.Root
    type="single"
    bind:value={() => (typeof value === 'string' ? value : ''), setters.single}
    {orientation}
    {loop}
    {disabled}
    child={root}
  />
{:else}
  <ToggleGroup.Root
    type="multiple"
    bind:value={() => [...selected], setters.multiple}
    {orientation}
    {loop}
    {disabled}
    child={root}
  />
{/if}
{#if name !== undefined}
  {#each selected as selectedValue (selectedValue)}
    <input type="hidden" {name} value={selectedValue} />
  {/each}
{/if}
