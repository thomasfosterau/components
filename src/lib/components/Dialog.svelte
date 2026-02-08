<script lang="ts">
	import { createDialog, melt } from '@melt-ui/svelte';
	import { clsx } from 'clsx';
	import { fade, fly } from 'svelte/transition';
	import Button from './Button.svelte';

	export let open = false;
	export let title = 'Dialog Title';
	export let description = '';
	
	// Allow consumers to override classes
	let overlayClass = '';
	export { overlayClass as overlayClass };
	let contentClass = '';
	export { contentClass as contentClass };
	let titleClass = '';
	export { titleClass as titleClass };
	let descriptionClass = '';
	export { descriptionClass as descriptionClass };

	const {
		elements: { trigger, overlay, content, title: dialogTitle, description: dialogDescription, close, portalled },
		states: { open: dialogOpen }
	} = createDialog({
		forceVisible: true
	});

	$: dialogOpen.set(open);
	$: open = $dialogOpen;
</script>

<Button use={melt($trigger)}>Open Dialog</Button>

<div use={melt($portalled)}>
	{#if $dialogOpen}
		<div 
			use={melt($overlay)} 
			class={clsx('fixed inset-0 z-50 bg-black/50', overlayClass)}
			transition:fade={{ duration: 150 }}
		/>
		<div
			use={melt($content)}
			class={clsx(
				'fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw] max-w-[450px]',
				'-translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg',
				'focus:outline-none',
				contentClass
			)}
			transition:fly={{
				duration: 150,
				y: 8,
				opacity: 0
			}}
		>
			<h2 use={melt($dialogTitle)} class={clsx('text-lg font-semibold text-slate-900 mb-2', titleClass)}>
				{title}
			</h2>
			
			{#if description}
				<p use={melt($dialogDescription)} class={clsx('text-sm text-slate-600 mb-4', descriptionClass)}>
					{description}
				</p>
			{/if}
			
			<div class="mb-4">
				<slot />
			</div>
			
			<div class="flex justify-end gap-2">
				<Button variant="outline" use={melt($close)}>Cancel</Button>
				<Button use={melt($close)}>Confirm</Button>
			</div>
		</div>
	{/if}
</div>
