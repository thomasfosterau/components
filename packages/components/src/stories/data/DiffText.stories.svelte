<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import DiffText from '../../lib/data/DiffText.svelte';
  import type { DiffSegment } from '../../lib/data/diff.ts';

  const wordDiff: readonly DiffSegment[] = [
    { kind: 'equal', text: 'The' },
    { kind: 'equal', text: 'dog' },
    { kind: 'delete', text: 'rose' },
    { kind: 'insert', text: 'briar' },
    { kind: 'equal', text: 'is' },
    { kind: 'delete', text: 'common' },
    { kind: 'insert', text: 'widespread' },
    { kind: 'insert', text: 'and' },
    { kind: 'insert', text: 'naturalised' },
    { kind: 'equal', text: 'across' },
    { kind: 'equal', text: 'south-eastern' },
    { kind: 'equal', text: 'Australia.' },
  ];

  const characterDiff: readonly DiffSegment[] = [
    { kind: 'equal', text: 'Rosa can' },
    { kind: 'delete', text: 'n' },
    { kind: 'equal', text: 'ina' },
  ];

  const { Story } = defineMeta({
    title: 'Data/DiffText',
    component: DiffText,
    parameters: {
      docs: {
        description: {
          component:
            '`<ins>` and `<del>` carry "added" and "removed" into the accessibility tree and into a copy of the page; the colour and the strike-through are the sighted reader’s copy of the same information, never the only copy.',
        },
      },
    },
  });
</script>

<Story name="Word diff">
  <DiffText segments={wordDiff} />
</Story>

<Story name="Character diff">
  <!-- No separator: the runs are parts of one word. -->
  <DiffText segments={characterDiff} separator="" />
</Story>

<Story name="Announced">
  <!-- Opt-in, because a forty-segment diff with a prefix on every run is
       unreadable. Inspect the accessibility tree to see the added words. -->
  <DiffText segments={wordDiff} insertLabel="inserted:" deleteLabel="deleted:" />
</Story>
