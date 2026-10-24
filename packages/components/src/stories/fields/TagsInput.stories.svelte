<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import TagsInput from '../../lib/fields/TagsInput.svelte';

  const { Story } = defineMeta({
    title: 'Fields/TagsInput',
    component: TagsInput,
    parameters: {
      docs: {
        description: {
          component:
            'Free-text tags: Enter or a comma commits, Backspace in an empty input reaches back into the tags, a paste of “a, b, c” makes three. Suggestions, static or async, come through bits-ui’s `Combobox`.',
        },
      },
    },
  });

  const traits = ['bee-friendly', 'bird-friendly', 'drought-tolerant', 'frost-hardy', 'native', 'edible'];
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const searchTraits = async (query: string) => {
    await wait(300);
    return traits.filter((trait) => trait.includes(query.toLowerCase()));
  };
</script>

<Story name="Plain">
  <div class="max-w-md">
    <FormField label="Tags" hint="Press Enter or comma after each.">
      {#snippet children(control)}
        <TagsInput {...control} values={['bee-friendly', 'native']} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="With suggestions">
  <div class="max-w-md">
    <FormField label="Traits">
      {#snippet children(control)}
        <TagsInput {...control} suggestions={traits} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Async">
  <div class="max-w-md">
    <FormField label="Traits" hint="Suggestions arrive after a short delay.">
      {#snippet children(control)}
        <TagsInput {...control} onSearch={searchTraits} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Max">
  <div class="max-w-md">
    <FormField label="Up to three tags">
      {#snippet children(control)}
        <TagsInput {...control} max={3} values={['a', 'b']} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Invalid">
  <div class="max-w-md">
    <FormField label="Tags" errors={['Add at least one tag.']} required>
      {#snippet children(control)}
        <TagsInput {...control} />
      {/snippet}
    </FormField>
  </div>
</Story>
