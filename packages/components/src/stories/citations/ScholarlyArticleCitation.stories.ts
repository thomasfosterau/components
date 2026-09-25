import type { Meta, StoryObj } from '@storybook/sveltekit';
import ScholarlyArticleCitation from '../../lib/citations/ScholarlyArticleCitation.svelte';

const meta = {
  title: 'Citations/ScholarlyArticleCitation',
  component: ScholarlyArticleCitation,
  parameters: {
    docs: {
      description: {
        component:
          'A journal article, with the ScholarlyArticle → PublicationIssue → PublicationVolume → Periodical chain as nested microdata, and DOI / ISSN links.',
      },
    },
  },
} satisfies Meta<typeof ScholarlyArticleCitation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    article: {
      title: 'A revision of Rosa section Caninae',
      authors: [
        { name: 'J. Smith', itemtype: 'Person' },
        { name: 'A. Jones', itemtype: 'Person' },
      ],
      datePublished: 1998,
      periodical: { title: 'Australian Systematic Botany', issn: '1030-1887' },
      volumeNumber: 11,
      issueNumber: 3,
      pageStart: 45,
      pageEnd: 67,
      doi: '10.1071/SB97001',
    },
  },
};

export const Minimal: Story = { args: { article: { title: 'A preprint' } } };
