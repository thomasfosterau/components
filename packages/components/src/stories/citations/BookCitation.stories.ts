import type { Meta, StoryObj } from '@storybook/sveltekit';
import BookCitation from '../../lib/citations/BookCitation.svelte';

const meta = {
  title: 'Citations/BookCitation',
  component: BookCitation,
  parameters: {
    docs: {
      description: {
        component:
          'A book as a compact author–date reference with Schema.org Book microdata. Contributors are resolved credits in credit order; every arm is independently optional. The record shape is local until `@thomasfosterau/biblio` is published.',
      },
    },
  },
} satisfies Meta<typeof BookCitation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    book: {
      title: 'The Left Hand of Darkness',
      authors: [{ name: 'Ursula K. Le Guin', href: '/people/le-guin', itemtype: 'Person' }],
      editors: [{ name: 'A. Editor', itemtype: 'Person' }],
      datePublished: 1969,
      edition: '3rd',
      series: { name: 'Hainish Cycle' },
      publisher: { name: 'Ace Books', address: { locality: 'New York' } },
      numberOfPages: 304,
      isbn: '9780441478125',
    },
  },
};

export const TitleOnly: Story = { args: { book: { title: 'An Undated Pamphlet' } } };

export const Untitled: Story = { args: { book: {} } };
