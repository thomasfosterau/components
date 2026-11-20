<script lang="ts">
  import { untrack } from 'svelte';
  import MentionInput from '../../../src/lib/fields/MentionInput.svelte';
  import type { MentionOption, MentionTrigger } from '../../../src/lib/fields/mentions.ts';

  interface Props {
    initial?: string | undefined;
    singleLine?: boolean | undefined;
    onSearch?: ((char: string, query: string) => void) | undefined;
  }

  let { initial = '', singleLine = false, onSearch }: Props = $props();

  const people: readonly MentionOption[] = [
    { id: 'user:42', label: 'Thomas Foster', description: 'Owner' },
    { id: 'user:7', label: 'Tilly Ng' },
  ];
  const plants: readonly MentionOption[] = [
    { id: 'plant:1', label: 'tomato' },
    { id: 'plant:2', label: 'thyme' },
  ];
  const match = (options: readonly MentionOption[], query: string) =>
    options.filter((option) => option.label.toLowerCase().startsWith(query.toLowerCase()));

  const triggers: readonly MentionTrigger[] = [
    {
      char: '@',
      search: (query) => {
        onSearch?.('@', query);
        return match(people, query);
      },
    },
    {
      char: '#',
      search: async (query) => {
        onSearch?.('#', query);
        return match(plants, query);
      },
    },
    {
      char: ':',
      minChars: 2,
      search: (query) => match([{ id: 'sun', label: 'sun' }], query),
      replace: () => '☀️',
    },
  ];

  let value = $state(untrack(() => initial));
  let displayValue = $state('');
</script>

<label for="note">Note</label>
<MentionInput id="note" bind:value bind:displayValue {triggers} {singleLine} />
<output data-testid="value">{value}</output>
<output data-testid="display">{displayValue}</output>
