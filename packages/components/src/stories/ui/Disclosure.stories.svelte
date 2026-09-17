<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Disclosure from '../../lib/ui/Disclosure.svelte';

  const { Story } = defineMeta({
    title: 'UI/Disclosure',
    component: Disclosure,
    parameters: {
      docs: {
        description: {
          component:
            'A native `<details>` wearing daisyUI `collapse`. Not on bits-ui deliberately: the platform already gives a focusable trigger, the expanded state, keyboard activation and find-in-page inside collapsed content, and nothing a primitive adds beats that.',
        },
      },
    },
  });
</script>

<Story name="Variants">
  <div class="flex max-w-lg flex-col gap-3">
    <Disclosure title="Arrow — the default">
      <p>The marker rotates as the section opens.</p>
    </Disclosure>
    <Disclosure title="Plus" variant="plus">
      <p>A plus that becomes a minus.</p>
    </Disclosure>
    <Disclosure title="Plain" variant="plain">
      <p>No marker at all; the summary is the whole affordance.</p>
    </Disclosure>
  </div>
</Story>

<Story name="Open">
  <div class="max-w-lg">
    <Disclosure title="Add an anatomy record" open>
      <p>
        An app opens a section like this when the form inside it failed, so the reader lands on the
        error rather than on a closed summary.
      </p>
    </Disclosure>
  </div>
</Story>

<Story name="A snippet summary">
  <div class="max-w-lg">
    <Disclosure>
      {#snippet title()}
        <span class="flex items-center gap-2">
          Chemistry
          <span class="badge badge-sm badge-neutral">12</span>
        </span>
      {/snippet}
      <p>Twelve recorded compounds.</p>
    </Disclosure>
  </div>
</Story>
