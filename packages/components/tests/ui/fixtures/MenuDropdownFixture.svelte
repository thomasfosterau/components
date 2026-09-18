<script lang="ts">
  import Menu from '../../../src/lib/ui/Menu.svelte';
  import MenuItem from '../../../src/lib/ui/MenuItem.svelte';
  import MenuSeparator from '../../../src/lib/ui/MenuSeparator.svelte';

  interface Props {
    label?: string;
    onSignOut?: () => void;
  }

  let { label = 'Account', onSignOut }: Props = $props();
</script>

<Menu mode="dropdown" {label}>
  {#snippet trigger({ props })}
    <button {...props} type="button">Ada Lovelace</button>
  {/snippet}
  <MenuItem href="/account">Your profile</MenuItem>
  <MenuItem href="/settings" disabled>Settings</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={onSignOut}>Sign out</MenuItem>
</Menu>
