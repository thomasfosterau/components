import type { Meta, StoryObj } from '@storybook/sveltekit';
import Map from '../lib/Map.svelte';

/**
 * `Map` paints the static raster first and upgrades to the live map from an
 * effect. Storybook has no Mapbox credential, so neither half fetches
 * anything: the raster 401s and the live map starts with no style. That is the
 * honest state of the component without a token, and the alternative is a
 * story that only works with a credential nobody reviewing it has — never put
 * a real token in a story, which is published with the static build.
 *
 * What IS reviewable is the switch: `interactive={false}` shows the raster
 * half intact, and the default shows what replaces it after hydration.
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
