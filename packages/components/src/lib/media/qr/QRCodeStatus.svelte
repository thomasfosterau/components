<!-- @component
The overlay on a loading or expired `QRCode`; internal, not exported.
-->
<script lang="ts">
  interface Props {
    status: 'loading' | 'expired';
    expiredLabel: string;
    refreshLabel: string;
    onRefresh: (() => void) | undefined;
  }

  let { status, expiredLabel, refreshLabel, onRefresh }: Props = $props();
</script>

{#if status === 'loading'}
  <span class="absolute inset-0 grid place-items-center">
    <span class="loading loading-spinner" aria-hidden="true"></span>
  </span>
{:else}
  <span class="bg-base-100/80 absolute inset-0 flex flex-col items-center justify-center gap-2">
    <span class="font-semibold">{expiredLabel}</span>
    {#if onRefresh}
      <button type="button" class="btn btn-sm btn-primary" onclick={onRefresh}>{refreshLabel}</button>
    {/if}
  </span>
{/if}
