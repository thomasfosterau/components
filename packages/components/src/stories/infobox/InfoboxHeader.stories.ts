import type { Meta, StoryObj } from '@storybook/sveltekit';
import InfoboxHeader from '../../lib/infobox/InfoboxHeader.svelte';

const meta = {
  title: 'Infobox/InfoboxHeader',
  component: InfoboxHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The title block at the top of an `Infobox`: an `h3` by default, deliberately outside the document outline. `headingLevel` raises it when the box is a section of the page in its own right.',
      },
    },
  },
} satisfies Meta<typeof InfoboxHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSubtitle: Story = {
  args: { title: 'Solanum lycopersicum', subtitle: 'Tomato' },
};

export const TitleOnly: Story = { args: { title: 'Bed 3' } };

export const AsASection: Story = {
  name: 'As a section (h2)',
  args: { title: 'Key facts', headingLevel: 2 },
};
