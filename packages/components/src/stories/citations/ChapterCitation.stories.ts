import type { Meta, StoryObj } from '@storybook/sveltekit';
import ChapterCitation from '../../lib/citations/ChapterCitation.svelte';

const meta = {
  title: 'Citations/ChapterCitation',
  component: ChapterCitation,
  parameters: {
    docs: {
      description: {
        component:
          'A chapter, with its containing book cited in full under `isPartOf` when the record carries it.',
      },
    },
  },
} satisfies Meta<typeof ChapterCitation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InABook: Story = {
  args: {
    chapter: {
      title: 'Hedgerow roses',
      authors: [{ name: 'J. Smith', itemtype: 'Person' }],
      chapterNumber: 4,
      pageStart: 101,
      pageEnd: 130,
      book: {
        title: 'Wild Roses of Britain',
        editors: [{ name: 'A. Jones', itemtype: 'Person' }],
        datePublished: 2004,
      },
    },
  },
};

export const Standalone: Story = { args: { chapter: { title: 'Hedgerow roses', pageStart: 55 } } };
