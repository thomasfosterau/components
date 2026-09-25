import type { Meta, StoryObj } from '@storybook/sveltekit';
import Publisher from '../../lib/citations/Publisher.svelte';

const meta = {
  title: 'Citations/Publisher',
  component: Publisher,
  parameters: {
    docs: {
      description: {
        component:
          'A publisher (or awarding institution) as Schema.org microdata, with the place as a PostalAddress of whichever parts are present.',
      },
    },
  },
} satisfies Meta<typeof Publisher>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithAddress: Story = {
  args: {
    publisher: { name: 'Oxford University Press', address: { locality: 'Oxford', country: 'UK' } },
  },
};

export const NameOnly: Story = { args: { publisher: { name: 'Ace Books' } } };

export const SelfPublished: Story = {
  args: { publisher: { name: 'A. Gardener', itemtype: 'Person' } },
};
