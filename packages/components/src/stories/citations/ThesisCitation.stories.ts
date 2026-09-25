import type { Meta, StoryObj } from '@storybook/sveltekit';
import ThesisCitation from '../../lib/citations/ThesisCitation.svelte';

const meta = {
  title: 'Citations/ThesisCitation',
  component: ThesisCitation,
  parameters: {
    docs: {
      description: {
        component: 'A thesis: author, title, year, degree and awarding institution, each optional.',
      },
    },
  },
} satisfies Meta<typeof ThesisCitation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    thesis: {
      title: 'Hybridisation in Rosa section Caninae',
      authors: [{ name: 'J. Smith', itemtype: 'Person' }],
      datePublished: 2019,
      degree: 'PhD',
      institution: { name: 'University of Sydney' },
    },
  },
};

export const TitleOnly: Story = {
  args: { thesis: { title: 'Hybridisation in Rosa section Caninae' } },
};
