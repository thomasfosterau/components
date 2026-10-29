<!-- @component
A set of toggles inside a `Toolbar` (Bold / Italic, alignment), sharing the toolbar's single Tab stop.
-->
<!--
  ToolbarToggleGroup — `ToggleGroup`'s props and look, built on bits-ui
  `Toolbar.Group` / `Toolbar.GroupItem` rather than a nested
  `ToggleGroup`: a nested group keeps its own roving focus, which the
  toolbar knows nothing about, and the toolbar's one Tab stop breaks. Here
  the items are toolbar controls, so ← / → run across the whole toolbar.

  `type="multiple"`: a `role="group"` of `aria-pressed` buttons.
  `type="single"`: the items are `radio`s, so the group is overridden to a
  `radiogroup`; as in the APG toolbar example, the arrows only move focus
  across the toolbar and Space / Enter selects. With `required`, pressing
  the selected item does nothing.
-->
<script lang="ts" generics="V extends string">
  import { Toolbar } from 'bits-ui';
  import { toggleClasses, toggleSetters, type ToggleGroupItem } from './toggle-classes.ts';
  import { buttonSize, type ButtonVariant, type Size, type Tone } from './tones.ts';

  type Props = {
    items: readonly ToggleGroupItem<V>[];
    /** Accessible name of the set ("Text style", "Alignment"). */
    label: string;
    /** @defaultValue `'primary'` */
    tone?: Tone | undefined;
    /** @defaultValue `'ghost'` */
    variant?: ButtonVariant | undefined;
    /** @defaultValue `'sm'` */
    size?: Size | undefined;
    disabled?: boolean | undefined;
    class?: string | undefined;
  } & (
    | {
        type: 'single';
        /** The selected value, `''` for none. Bindable. */
        value?: V | '' | undefined;
        onValueChange?: ((value: V | '') => void) | undefined;
        /** Pressing the selected item does nothing. */
        required?: boolean | undefined;
      }
    | {
        type: 'multiple';
        /** The selected values. Bindable. */
        value?: readonly V[] | undefined;
        onValueChange?: ((value: V[]) => void) | undefined;
        required?: undefined;
      }
  );

  let {
    type,
    items,
    label,
    value = $bindable(),
    onValueChange,
    required = false,
    tone = 'primary',
    variant = 'ghost',
    size = 'sm',
    disabled = false,
    class: className,
  }: Props = $props();

  const setters = toggleSetters<V>({
    required: () => required,
    assign: (next) => (value = next),
    notify: () => onValueChange,
  });
</script>

{#snippet group({ props }: { props: Record<string, unknown> })}
  <div
    {...props}
    role={type === 'single' ? 'radiogroup' : 'group'}
    aria-label={label}
    class={['inline-flex items-center gap-0.5', className]}
  >
    {#each items as entry (entry.value)}
      <Toolbar.GroupItem value={entry.value} disabled={entry.disabled ?? false}>
        {#snippet child({ props: itemProps, pressed })}
          <button
            {...itemProps}
            type="button"
            class={['btn', buttonSize[size], toggleClasses(pressed, tone, variant), entry.iconOnly && 'btn-square']}
          >
            {@render entry.icon?.()}
            {#if entry.iconOnly}<span class="sr-only">{entry.label}</span>{:else}{entry.label}{/if}
          </button>
        {/snippet}
      </Toolbar.GroupItem>
    {/each}
  </div>
{/snippet}

{#if type === 'single'}
  <Toolbar.Group
    type="single"
    bind:value={() => (typeof value === 'string' ? value : ''), setters.single}
    {disabled}
    child={group}
  />
{:else}
  <Toolbar.Group
    type="multiple"
    bind:value={() => [...(Array.isArray(value) ? value : [])], setters.multiple}
    {disabled}
    child={group}
  />
{/if}
