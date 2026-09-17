<script lang="ts">
  import { clsx } from 'clsx';
  import { Select } from 'melt/builders';
  import type { SelectItem } from '../types.js';

  type Props = {
    items?: SelectItem[];
    /** The selected item's `value`. Bindable. */
    value?: string | undefined;
    placeholder?: string;
    /** Accessible name for the trigger. */
    label?: string;
    triggerClass?: string;
    contentClass?: string;
    itemClass?: string;
  };

  let {
    items = [],
    value = $bindable(undefined),
    placeholder = 'Select an option',
    label = 'Select option',
    triggerClass = '',
    contentClass = '',
    itemClass = ''
  }: Props = $props();

  const select = new Select<string>({
    value: () => value,
    onValueChange: (next) => (value = next)
  });

  const selectedLabel = $derived(items.find((item) => item.value === value)?.label);
</script>

<button
  {...select.trigger}
  aria-label={label}
  class={clsx(
    'flex h-10 w-full items-center justify-between rounded-md border border-slate-300',
    'bg-white px-3 py-2 text-sm placeholder:text-slate-400',
    'focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 focus:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-50',
    triggerClass
  )}
>
  <span class={selectedLabel ? '' : 'text-slate-400'}>
    {selectedLabel ?? placeholder}
  </span>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="h-4 w-4 opacity-50"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
</button>

<div
  {...select.content}
  class={clsx(
    'z-50 max-h-[300px] overflow-y-auto rounded-md border border-slate-200',
    'bg-white p-1 shadow-md focus:outline-none',
    contentClass
  )}
>
  {#each items as item (item.value)}
    {@const option = select.getOption(item.value, item.label)}
    <div
      {...option}
      aria-disabled={item.disabled || undefined}
      class={clsx(
        'relative flex w-full cursor-default items-center rounded-sm select-none',
        'py-1.5 pr-2 pl-8 text-sm outline-none',
        'data-[highlighted]:bg-slate-100',
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        select.isSelected(item.value) && 'bg-slate-100',
        itemClass
      )}
    >
      {#if select.isSelected(item.value)}
        <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="h-4 w-4"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      {/if}
      {item.label}
    </div>
  {/each}
</div>
