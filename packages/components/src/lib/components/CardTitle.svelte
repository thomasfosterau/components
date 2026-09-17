<script lang="ts">
  import { clsx } from 'clsx';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  type Props = Omit<HTMLAttributes<HTMLHeadingElement>, 'class'> & {
    class?: string;
    children?: Snippet;
  };

  let { class: className = '', children, ...rest }: Props = $props();

  const classes = $derived(clsx('text-2xl font-semibold leading-none tracking-tight', className));
</script>

<h3 class={classes} {...rest}>
  {@render children?.()}
</h3>
