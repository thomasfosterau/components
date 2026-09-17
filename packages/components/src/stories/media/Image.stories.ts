import type { Meta, StoryObj } from '@storybook/sveltekit';
import Image from '../../lib/media/Image.svelte';

const meta = {
  title: 'Media/Image',
  component: Image,
  parameters: {
    docs: {
      description: {
        component:
          'A responsive `<img>`. `src` for a plain image, or `id` (+ `base`/`widths`) for a width-bucketed `srcset`; `sources` wraps everything in `<picture>` for art direction or format negotiation.',
      },
    },
  },
} satisfies Meta<typeof Image>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlainSrc: Story = {
  args: {
    src: 'https://placehold.co/640x360',
    alt: 'A placeholder image',
    width: 640,
    height: 360,
  },
};

export const BucketedSrcset: Story = {
  args: {
    id: 'a1b2c3',
    alt: 'A gardening bed in spring',
    width: 1280,
    height: 720,
  },
};

export const CustomWidths: Story = {
  args: {
    id: 'a1b2c3',
    alt: 'A close-up of tomato seedlings',
    widths: [400, 800],
    width: 800,
    height: 600,
  },
};

export const WithPictureSources: Story = {
  args: {
    src: 'https://placehold.co/640x360',
    alt: 'A responsive picture with format negotiation',
    sources: [
      { srcset: 'https://placehold.co/640x360.avif', type: 'image/avif' },
      { srcset: 'https://placehold.co/640x360.webp', type: 'image/webp' },
    ],
    width: 640,
    height: 360,
  },
};

export const Eager: Story = {
  args: {
    src: 'https://placehold.co/640x360',
    alt: 'An above-the-fold hero image, loaded eagerly',
    eager: true,
    width: 640,
    height: 360,
  },
};

export const Decorative: Story = {
  args: {
    src: 'https://placehold.co/200x100',
    alt: '',
    width: 200,
    height: 100,
  },
};
