<script lang="ts">
	import { clsx } from 'clsx';

	// Allow consumers to override any class
	let className = '';
	export { className as class };

	const baseClasses = 'text-2xl font-semibold leading-none tracking-tight';

	$: classes = clsx(baseClasses, className);
</script>

<h3 class={classes} {...$$restProps}>
	<slot />
</h3>
