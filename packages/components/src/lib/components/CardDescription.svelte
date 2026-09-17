<script lang="ts">
	import { clsx } from 'clsx';

	// Allow consumers to override any class
	let className = '';
	export { className as class };

	const baseClasses = 'text-sm text-slate-600';

	$: classes = clsx(baseClasses, className);
</script>

<p class={classes} {...$$restProps}>
	<slot />
</p>
