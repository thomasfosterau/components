<script lang="ts">
  import { clsx } from 'clsx';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
    class?: string;
    children?: Snippet;
  };

  let { class: className = '', children, ...rest }: Props = $props();

  const classes = $derived(clsx('p-6', className));
</script>

<div class={classes} {...rest}>
  {@render children?.()}
</div>
