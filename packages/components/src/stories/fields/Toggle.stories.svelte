<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Toggle from '../../lib/fields/Toggle.svelte';

  const { Story } = defineMeta({
    title: 'Fields/Toggle',
    component: Toggle,
    parameters: {
      docs: {
        description: {
          component:
            'A switch: a setting that takes effect immediately, announced "on"/"off" rather than "ticked". `onChange` may refuse the change — whatever it resolves to is written back onto the control, so a rejected change never leaves the switch showing a state that is not true.',
        },
      },
    },
  });

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
</script>

<script lang="ts">
  let notifications = $state(true);
</script>

<Story name="Plain">
  <Toggle label="Email me a weekly summary" bind:checked={notifications} />
</Story>

<Story name="With a description">
  <Toggle
    label="Notify this browser"
    description="Only this browser is registered — your other devices are asked separately."
    checked={false}
  />
</Story>

<Story name="A change that is refused">
  <Toggle
    label="Notify this browser"
    description="This one always says no, after a moment’s thought — watch the switch come back."
    checked={false}
    onChange={async () => {
      await wait(600);
      return false;
    }}
  />
</Story>

<Story name="Disabled">
  <Toggle label="Email me a weekly summary" checked disabled />
</Story>
