<script lang="ts">
  import { clsx } from 'clsx';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  type Props = Omit<HTMLAttributes<HTMLParagraphElement>, 'class'> & {
    class?: string;
    children?: Snippet;
  };

  let { class: className = '', children, ...rest }: Props = $props();

  const classes = $derived(clsx('text-sm text-slate-600', className));
</script>

<p class={classes} {...rest}>
  {@render children?.()}
</p>
