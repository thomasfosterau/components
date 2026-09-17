import type { Meta, StoryObj } from '@storybook/sveltekit';
import StaticMap from '../../lib/maps/StaticMap.svelte';

/**
 * Storybook has no Mapbox credential, so these build the URL with a
 * placeholder token and the raster will not load. That is the honest state of
 * the component without a token, and it is what the URL shape is here to show
 * — `staticMapUrl` is unit-tested separately, where the assertion is the URL
 * itself rather than the picture. Never put a real token in a story: a story
 * is published with the static Storybook build.
 */
const accessToken = 'pk.storybook-placeholder';

const meta = {
  title: 'Maps/StaticMap',
  component: StaticMap,
  tags: ['autodocs'],
} satisfies Meta<typeof StaticMap>;

export default meta;
type Story = StoryObj<typeof meta>;

const style = { username: 'mapbox', styleId: 'outdoors-v12' };

export const Camera: Story = {
  args: {
    style,
    view: {
      kind: 'camera',
      camera: { centre: { longitude: 144.963, latitude: -37.814 }, zoom: 13 },
    },
    width: 640,
    height: 360,
    accessToken,
    alt: 'The site’s location in Naarm / Melbourne',
  },
};

export const BoundingBox: Story = {
  args: {
    style,
    view: {
      kind: 'bbox',
      bbox: {
        min: { longitude: 144.9, latitude: -37.9 },
        max: { longitude: 145.05, latitude: -37.75 },
      },
    },
    width: 640,
    height: 360,
    accessToken,
    alt: 'The area the collection was gathered from',
  },
};

/** A decorative map beside a written address takes an empty alt, deliberately. */
export const Decorative: Story = {
  args: {
    style,
    view: {
      kind: 'camera',
      camera: { centre: { longitude: 144.963, latitude: -37.814 }, zoom: 15 },
    },
    width: 320,
    height: 180,
    accessToken,
    alt: '',
  },
};
