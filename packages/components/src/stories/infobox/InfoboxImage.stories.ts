import type { Meta, StoryObj } from '@storybook/sveltekit';
import InfoboxImage from '../../lib/infobox/InfoboxImage.svelte';

/**
 * An inline SVG rather than a hosted file: a story that reaches the network
 * fails in the sandbox the static build runs in, and a broken image teaches
 * nothing about the component.
 */
const leaf =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="#eff6ef"/><path d="M60 160 C 110 40, 220 40, 270 60 C 250 150, 140 175, 60 160 Z" fill="#15803d"/><path d="M60 160 C 130 120, 200 90, 270 60" stroke="#eff6ef" stroke-width="4" fill="none"/></svg>',
  );

const meta = {
  title: 'Infobox/InfoboxImage',
  component: InfoboxImage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The picture at the top of an `Infobox`. `eager` sets `loading="eager"` + `fetchpriority="high"` together, for the identifying image that is the page’s LCP candidate; the default is lazy, since an infobox usually sits beside the prose rather than above it.',
      },
    },
  },
} satisfies Meta<typeof InfoboxImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCaption: Story = {
  args: {
    src: leaf,
    alt: 'A simple leaf',
    caption: 'Leaf of Solanum lycopersicum, abaxial surface',
    width: 320,
    height: 200,
  },
};

export const Decorative: Story = {
  args: { src: leaf, alt: '', width: 320, height: 200 },
};

export const Eager: Story = {
  args: {
    src: leaf,
    alt: 'The article’s identifying image, loaded eagerly',
    eager: true,
    width: 320,
    height: 200,
  },
};
