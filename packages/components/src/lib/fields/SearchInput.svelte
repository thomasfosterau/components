<!-- @component
A `type="search"` field with a leading icon, a clear button while there is text, and a spinner while `pending`. `name` defaults to `'q'` and `placeholder` to `'Search'`.
-->
<!--
  SearchInput — a `type="search"` field in daisyUI's composite `input`
  wrapper, with a leading icon, a clear button while there is text, and a
  spinner while `pending`.

  The wrapper is a `<div>`, not a `<label>`: the clear button lives inside it,
  and a button inside a label is both mis-named (the label's text becomes part
  of ITS name) and label-activated (clicking it also focuses the field). The
  visible label is optional — `label` always supplies the accessible name.

  ARIA contract: the leading magnifier is `aria-hidden`, because the field's
  own name already says what it is; the clear button is a real button with a
  visually-hidden name rather than a bare glyph; the spinner is `aria-hidden`,
  because a busy state must not change the field's accessible name.

  `onInput` fires on every keystroke (feed it to whatever debounce the app
  uses) and `onSubmit` on Enter.
-->
<script lang="ts">
  import { Search, X } from '@lucide/svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import Spinner from '../ui/Spinner.svelte';
  import { inputSize, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'size'> {
    /** Accessible name of the field. */
    label: string;
    /**
     * The query. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /** Fires on every change with the current text. */
    onInput?: ((query: string) => void) | undefined;
    /** Fires on Enter with the current text. */
    onSubmit?: ((query: string) => void) | undefined;
    /** Fires after the clear button empties the field. */
    onClear?: (() => void) | undefined;
    /** A search is in flight. */
    pending?: boolean | undefined;
    /**
     * Accessible name of the clear button.
     * @defaultValue `'Clear search'`
     */
    clearLabel?: string | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
  }

  let {
    label,
    value = $bindable(''),
    onInput,
    onSubmit,
    onClear,
    pending = false,
    clearLabel = 'Clear search',
    size = 'md',
    name = 'q',
    placeholder = 'Search',
    class: className,
    ...rest
  }: Props = $props();

  const clear = (): void => {
    value = '';
    onInput?.('');
    onClear?.();
  };
</script>

<div class={['input w-full', inputSize[size], className]}>
  <Search class="size-4 opacity-60" aria-hidden="true" />
  <input
    {...rest}
    type="search"
    {name}
    {placeholder}
    aria-label={label}
    bind:value
    oninput={() => onInput?.(value)}
    onkeydown={(event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onSubmit?.(value);
      }
    }}
  />
  {#if pending}
    <Spinner decorative size="xs" />
  {:else if value !== ''}
    <button type="button" class="btn btn-ghost btn-xs btn-circle" onclick={clear}>
      <X class="size-3.5" aria-hidden="true" />
      <span class="sr-only">{clearLabel}</span>
    </button>
  {/if}
</div>
