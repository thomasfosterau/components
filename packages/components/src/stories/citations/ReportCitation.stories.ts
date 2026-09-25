import type { Meta, StoryObj } from '@storybook/sveltekit';
import ReportCitation from '../../lib/citations/ReportCitation.svelte';

const meta = {
  title: 'Citations/ReportCitation',
  component: ReportCitation,
  parameters: {
    docs: {
      description: {
        component: 'A report — usually authored and published by the same Organization.',
      },
    },
  },
} satisfies Meta<typeof ReportCitation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    report: {
      title: 'State of the Environment 2021',
      authors: [{ name: 'Department of the Environment', itemtype: 'Organization' }],
      datePublished: '2021-07-19',
      publisher: { name: 'Department of the Environment', address: { locality: 'Canberra' } },
      numberOfPages: 88,
      url: 'https://example.org/soe-2021',
    },
  },
};

export const Undated: Story = { args: { report: { title: 'Internal memo' } } };
