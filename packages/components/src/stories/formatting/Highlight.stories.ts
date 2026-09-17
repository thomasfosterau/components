import type { Meta, StoryObj } from '@storybook/sveltekit';
import Highlight from '../../lib/formatting/Highlight.svelte';

const meta = {
  title: 'Formatting/Highlight',
  component: Highlight,
  parameters: {
    docs: {
      description: {
        component:
          "Best-effort client-side token highlight for search results — wraps case-insensitive matches of `query`'s whitespace-split tokens in `<mark>`.",
      },
    },
  },
} satisfies Meta<typeof Highlight>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleMatch: Story = {
  args: { text: 'The quick brown fox jumps over the lazy dog', query: 'fox' },
};

export const MultipleTokens: Story = {
  args: { text: 'The quick brown fox jumps over the lazy dog', query: 'quick lazy' },
};

export const CaseInsensitive: Story = {
  args: { text: 'Gardening in Australia: a seasonal guide', query: 'AUSTRALIA' },
};

export const NoMatch: Story = {
  args: { text: 'The quick brown fox jumps over the lazy dog', query: 'zebra' },
};

export const EmptyQuery: Story = {
  args: { text: 'The quick brown fox jumps over the lazy dog', query: '' },
};
