<script lang="ts">
	import { clsx } from 'clsx';

	// Allow consumers to override any class
	let className = '';
	export { className as class };

	const baseClasses = 'rounded-lg border border-slate-200 bg-white shadow-sm';

	$: classes = clsx(baseClasses, className);
</script>

<div class={classes} {...$$restProps}>
	<slot />
</div>
