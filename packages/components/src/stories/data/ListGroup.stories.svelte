<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ListGroup from '../../lib/data/ListGroup.svelte';
  import ListRow from '../../lib/data/ListRow.svelte';
  import Avatar from '../../lib/ui/Avatar.svelte';
  import Disclosure from '../../lib/ui/Disclosure.svelte';

  const { Story } = defineMeta({
    title: 'Data/ListGroup',
    component: ListGroup,
    parameters: {
      docs: {
        description: {
          component:
            'A settings section: a region named by its heading, holding a list of `ListRow`s. A control row names its switch or select after the row’s headline, so a visibly labelled control is never an unnamed one.',
        },
      },
    },
  });

  const contacts = [
    { name: 'Ada Lovelace', role: 'Analyst' },
    { name: 'Grace Hopper', role: 'Rear admiral' },
    { name: 'Alan Turing', role: 'Mathematician' },
  ];
</script>

<script lang="ts">
  let digests = $state(true);
  let theme = $state('system');
</script>

<Story name="Settings page">
  <div class="flex max-w-md flex-col gap-6">
    <ListGroup title="Notifications" description="How we reach you." footer="Changes save at once.">
      <ListRow headline="Email digests" supporting="A summary every Monday.">
        {#snippet trailing({ labelledBy, describedBy })}
          <input
            type="checkbox"
            role="switch"
            class="toggle"
            bind:checked={digests}
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
          />
        {/snippet}
      </ListRow>
      <ListRow headline="Theme">
        {#snippet trailing({ labelledBy })}
          <select class="select select-sm w-32" bind:value={theme} aria-labelledby={labelledBy}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        {/snippet}
      </ListRow>
      <ListRow headline="Units" href="#units">
        {#snippet trailing()}<span class="text-base-content/70">Metric</span>{/snippet}
      </ListRow>
    </ListGroup>
    <ListGroup title="Account">
      <ListRow headline="Email" supporting="me@example.com" href="#email" />
      <ListRow headline="Delete account" tone="error" onclick={() => {}} />
    </ListGroup>
  </div>
</Story>

<Story name="Contacts with avatars">
  <ListGroup title="Contacts" class="max-w-md">
    {#each contacts as contact (contact.name)}
      <ListRow headline={contact.name} supporting={contact.role} href="#contact">
        {#snippet leading()}<Avatar name={contact.name} size="sm" aria-hidden="true" />{/snippet}
      </ListRow>
    {/each}
  </ListGroup>
</Story>

<Story name="Expander row (pattern)">
  <!-- An expander row is a control row whose children hold a Disclosure;
       there is no separate component. -->
  <ListGroup title="Advanced" class="max-w-md">
    <ListRow headline="Proxy" supporting="Route traffic through a proxy server.">
      <Disclosure title="Proxy settings">
        <p class="text-sm">Host, port and credentials go here.</p>
      </Disclosure>
    </ListRow>
  </ListGroup>
</Story>

<Story name="Plain variant">
  <ListGroup title="Recent" variant="plain" class="max-w-md">
    <ListRow headline="Back bed" overline="Garden" supporting="Nine beds" href="#back" />
    <ListRow headline="Front bed" overline="Garden" supporting="Four beds" href="#front" />
  </ListGroup>
</Story>
