<script lang="ts">
	import { clsx } from 'clsx';

	// Allow consumers to override any class
	let className = '';
	export { className as class };

	const baseClasses = 'flex flex-col space-y-1.5 p-6';

	$: classes = clsx(baseClasses, className);
</script>

<div class={classes} {...$$restProps}>
	<slot />
</div>
