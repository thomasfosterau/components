import type { Meta, StoryObj } from '@storybook/sveltekit';
import ContextLinks from '../../lib/links/ContextLinks.svelte';

const meta = {
  title: 'Links/ContextLinks',
  component: ContextLinks,
  parameters: {
    docs: {
      description: {
        component:
          'The "About:" row under a piece of content — a label, then a link per thing it is about. Renders nothing when there are none.',
      },
    },
  },
} satisfies Meta<typeof ContextLinks>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    links: [
      { href: '/taxa/rosa-canina', label: 'Rosa canina' },
      { href: '/gardens/1/beds/4', label: 'Bed 4' },
    ],
  },
};

export const CustomLabel: Story = {
  args: { label: 'Regarding', links: [{ href: '/posts/1', label: 'Pruning dog roses' }] },
};

export const Empty: Story = { args: { links: [] } };
