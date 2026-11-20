<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import AuthCard from '../../../src/lib/forms/AuthCard.svelte';
  import { setComponentsContext, type EnhanceForm } from '../../../src/lib/context.svelte.ts';

  type Props = Omit<ComponentProps<typeof AuthCard>, 'fields' | 'notice'> & {
    contextEnhance?: EnhanceForm | undefined;
    noticeText?: string | undefined;
  };

  let { contextEnhance, noticeText, ...props }: Props = $props();

  // svelte-ignore state_referenced_locally
  setComponentsContext({ enhance: contextEnhance, href: (path) => `/en${path}` });
</script>

<AuthCard {...props}>
  {#snippet notice()}
    {#if noticeText !== undefined}<p>{noticeText}</p>{/if}
  {/snippet}
  {#snippet fields()}
    <label>Password <input type="password" name="password" /></label>
  {/snippet}
</AuthCard>
