<script lang="ts">
  import DropdownMenu from '../../../src/lib/ui/DropdownMenu.svelte';
  import MenuItem from '../../../src/lib/ui/MenuItem.svelte';
  import MenuSeparator from '../../../src/lib/ui/MenuSeparator.svelte';

  interface Props {
    label?: string;
    onSignOut?: () => void;
  }

  let { label = 'Account', onSignOut }: Props = $props();
</script>

<DropdownMenu {label}>
  {#snippet trigger({ props })}
    <button {...props} type="button">Ada Lovelace</button>
  {/snippet}
  <MenuItem href="/account">Your profile</MenuItem>
  <MenuItem href="/settings" disabled>Settings</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={onSignOut}>Sign out</MenuItem>
</DropdownMenu>
