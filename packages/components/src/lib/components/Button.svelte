<script lang="ts">
  import { clsx } from 'clsx';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  type Props = Omit<HTMLButtonAttributes, 'class'> & {
    variant?: 'default' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    class?: string;
    children?: Snippet;
  };

  let {
    variant = 'default',
    size = 'md',
    disabled = false,
    type = 'button',
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variantClasses = {
    default: 'bg-slate-900 text-slate-50 hover:bg-slate-800 focus-visible:ring-slate-950',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 focus-visible:ring-slate-400',
    outline:
      'border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-900 focus-visible:ring-slate-400',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-900 focus-visible:ring-slate-400'
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-8 text-lg'
  };

  const classes = $derived(
    clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)
  );
</script>

<button {type} {disabled} class={classes} {...rest}>
  {@render children?.()}
</button>
