import type { Meta, StoryObj } from '@storybook/sveltekit';
import Embed from '../../lib/media/Embed.svelte';

// Local posters: the stories request nothing from a provider until a button is pressed.
const poster = (fill: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="${fill}"/></svg>`,
  )}`;

const meta = {
  title: 'Media/Embed',
  component: Embed,
  parameters: {
    docs: {
      description: {
        component:
          'A click-to-load facade for a third-party iframe. Nothing loads from the provider until the button is pressed; the button is described by the privacy notice, a plain link reaches the content without loading it, and pressing it moves focus into the player.',
      },
    },
  },
  args: { class: 'max-w-xl' },
} satisfies Meta<typeof Embed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const YouTube: Story = {
  args: {
    provider: 'youtube',
    id: 'dQw4w9WgXcQ',
    title: 'Planting garlic',
    poster: poster('#588157'),
    start: 30,
  },
};

export const Vimeo: Story = {
  args: {
    provider: 'vimeo',
    id: '76979871',
    title: 'A year in the glasshouse',
    poster: poster('#3a5a40'),
  },
};

export const Map: Story = {
  args: {
    provider: 'google-maps',
    id: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.8!2d144.96!3d-37.81',
    title: 'The community garden',
    aspect: 4 / 3,
  },
};

/** Until the app's consent category is granted, the button asks to allow the provider. */
export const ConsentGated: Story = {
  args: {
    provider: 'youtube',
    id: 'dQw4w9WgXcQ',
    title: 'Planting garlic',
    poster: poster('#a3b18a'),
    consent: { granted: false, grant: () => undefined },
  },
};

export const NotEmbeddable: Story = {
  args: { provider: 'generic', id: 'https://unknown.example/widget', title: 'An unlisted widget' },
};
