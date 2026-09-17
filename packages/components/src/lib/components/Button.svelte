<script lang="ts">
	import { clsx } from 'clsx';

	export let variant: 'default' | 'secondary' | 'outline' | 'ghost' = 'default';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	
	// Allow consumers to override any class
	let className = '';
	export { className as class };

	const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
	
	const variantClasses = {
		default: 'bg-slate-900 text-slate-50 hover:bg-slate-800 focus-visible:ring-slate-950',
		secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 focus-visible:ring-slate-400',
		outline: 'border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-900 focus-visible:ring-slate-400',
		ghost: 'bg-transparent hover:bg-slate-100 text-slate-900 focus-visible:ring-slate-400'
	};
	
	const sizeClasses = {
		sm: 'h-8 px-3 text-sm',
		md: 'h-10 px-4 py-2',
		lg: 'h-12 px-8 text-lg'
	};

	$: classes = clsx(
		baseClasses,
		variantClasses[variant],
		sizeClasses[size],
		className
	);
</script>

<button 
	{type}
	{disabled}
	class={classes}
	on:click
	{...$$restProps}
>
	<slot />
</button>
