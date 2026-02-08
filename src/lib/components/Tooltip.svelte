<script lang="ts">
	import { createTooltip } from '@melt-ui/svelte';
	import { clsx } from 'clsx';
	import { fade } from 'svelte/transition';

	export let text: string;
	
	// Allow consumers to override classes
	let triggerClass = '';
	export { triggerClass as triggerClass };
	let contentClass = '';
	export { contentClass as contentClass };

	const {
		elements: { trigger, content, arrow },
		states: { open }
	} = createTooltip({
		positioning: {
			placement: 'top'
		},
		openDelay: 0,
		closeDelay: 0,
		closeOnPointerDown: false,
		forceVisible: true
	});
</script>

<span use:melt={$trigger} class={clsx('inline-block', triggerClass)}>
	<slot />
</span>

{#if $open}
	<div
		use:melt={$content}
		transition:fade={{ duration: 100 }}
		class={clsx(
			'z-50 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-slate-50 shadow-md',
			contentClass
		)}
	>
		<div use:melt={$arrow} />
		{text}
	</div>
{/if}
