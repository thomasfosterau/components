<script lang="ts">
  import FormField from '../../lib/fields/FormField.svelte';
  import MentionInput from '../../lib/fields/MentionInput.svelte';
  import type { MentionOption, MentionTrigger } from '../../lib/fields/mentions.ts';

  interface Props {
    /** One line instead of a textarea. */
    singleLine?: boolean | undefined;
  }

  let { singleLine = false }: Props = $props();

  const people: readonly MentionOption[] = [
    { id: 'user:42', label: 'Thomas Foster', description: 'Owner' },
    { id: 'user:7', label: 'Tilly Ng', description: 'Volunteer' },
    { id: 'user:9', label: 'Aroha Walker', description: 'Volunteer' },
  ];
  const plants: readonly MentionOption[] = ['tomato', 'thyme', 'tarragon', 'basil', 'beetroot'].map((name) => ({
    id: `plant:${name}`,
    label: name,
  }));
  const emoji: readonly (MentionOption & { glyph: string })[] = [
    { id: 'sun', label: 'sun', description: '☀️', glyph: '☀️' },
    { id: 'seedling', label: 'seedling', description: '🌱', glyph: '🌱' },
    { id: 'tomato', label: 'tomato', description: '🍅', glyph: '🍅' },
  ];

  const startsWith = <T extends MentionOption>(options: readonly T[], query: string): T[] =>
    options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));

  const triggers: readonly MentionTrigger[] = [
    {
      char: '@',
      search: async (query, signal) => {
        await new Promise((resolve) => setTimeout(resolve, 150));
        return signal.aborted ? [] : startsWith(people, query);
      },
    },
    { char: '#', search: (query) => startsWith(plants, query) },
    {
      char: ':',
      minChars: 1,
      search: (query) => startsWith(emoji, query),
      replace: (option) => emoji.find((e) => e.id === option.id)?.glyph ?? '',
    },
  ];

  let value = $state('Thanks @[Thomas Foster](user:42), the #[tomato](plant:tomato) seedlings are up ');
</script>

<div class="max-w-lg space-y-3">
  <FormField label="Comment" hint="Type @ for people, # for plants, : for emoji.">
    {#snippet children(control)}
      <MentionInput {...control} bind:value {triggers} {singleLine} />
    {/snippet}
  </FormField>
  <p class="text-base-content/70 text-sm">Stored: <code class="break-all">{value}</code></p>
</div>
