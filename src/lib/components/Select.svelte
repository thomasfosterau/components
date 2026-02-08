<script lang="ts">
	import { createSelect, melt } from '@melt-ui/svelte';
	import { clsx } from 'clsx';
	import { fade } from 'svelte/transition';

	type Item = {
		value: string;
		label: string;
		disabled?: boolean;
	};

	export let items: Item[] = [];
	export let selected: Item | undefined = undefined;
	export let placeholder = 'Select an option';
	
	// Allow consumers to override classes
	let triggerClass = '';
	export { triggerClass as triggerClass };
	let contentClass = '';
	export { contentClass as contentClass };
	let itemClass = '';
	export { itemClass as itemClass };

	const {
		elements: { trigger, menu, option },
		states: { selectedLabel, open },
		helpers: { isSelected }
	} = createSelect<string>({
		forceVisible: true,
		positioning: {
			placement: 'bottom',
			fitViewport: true,
			sameWidth: true
		}
	});

	$: if (selected) {
		selectedLabel.set(selected.label);
	}
</script>

<button
	use={melt($trigger)}
	class={clsx(
		'flex h-10 w-full items-center justify-between rounded-md border border-slate-300',
		'bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400',
		'focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
		'disabled:cursor-not-allowed disabled:opacity-50',
		triggerClass
	)}
	aria-label="Select option"
>
	<span class={$selectedLabel ? '' : 'text-slate-400'}>
		{$selectedLabel || placeholder}
	</span>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="h-4 w-4 opacity-50"
	>
		<path d="m6 9 6 6 6-6" />
	</svg>
</button>

{#if $open}
	<div
		use={melt($menu)}
		class={clsx(
			'z-50 max-h-[300px] overflow-y-auto rounded-md border border-slate-200',
			'bg-white p-1 shadow-md focus:outline-none',
			contentClass
		)}
		transition:fade={{ duration: 150 }}
	>
		{#each items as item}
			<div
				use={melt($option({ value: item.value, label: item.label, disabled: item.disabled }))}
				class={clsx(
					'relative flex w-full cursor-default select-none items-center rounded-sm',
					'py-1.5 pl-8 pr-2 text-sm outline-none',
					'hover:bg-slate-100 focus:bg-slate-100',
					'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
					$isSelected(item.value) && 'bg-slate-100',
					itemClass
				)}
			>
				{#if $isSelected(item.value)}
					<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
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
{/if}
