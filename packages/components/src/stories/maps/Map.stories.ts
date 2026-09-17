import type { Meta, StoryObj } from '@storybook/sveltekit';
import Map from '../../lib/maps/Map.svelte';

/**
 * `Map` paints the static raster first and upgrades to the live map from an
 * effect. Without a Mapbox credential the raster 401s, and without the
 * optional `mapbox-gl` peer — which this repository deliberately does not
 * install — the upgrade lands on the "unavailable" sentence. Both are the
 * behaviour worth seeing: the alternative is a story that only works with a
 * credential nobody reviewing it has.
 *
 * `interactive={false}` is the one that shows the raster half intact.
 */
const accessToken = 'pk.storybook-placeholder';
const style = { username: 'mapbox', styleId: 'outdoors-v12' };
const camera = { centre: { longitude: 144.963, latitude: -37.814 }, zoom: 13 };

const meta = {
  title: 'Maps/Map',
  component: Map,
  tags: ['autodocs'],
} satisfies Meta<typeof Map>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpgradesOnHydration: Story = {
  args: { accessToken, style, camera, width: 640, height: 360, alt: 'The site’s location' },
};

/** Pinned to the raster — a thumbnail, a print view. */
export const StaticOnly: Story = {
  args: {
    accessToken,
    style,
    camera,
    width: 320,
    height: 180,
    alt: 'The site’s location',
    interactive: false,
  },
};
