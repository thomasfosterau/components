import type { Meta, StoryObj } from '@storybook/sveltekit';
import DynamicMap from '../lib/DynamicMap.svelte';

/**
 * `mapbox-gl` is this package's REQUIRED peer, loaded by a dynamic `import()`
 * inside the mount effect, and it IS installed here — so Mapbox GL itself
 * initialises in these stories. What it cannot do is fetch a style: the token
 * is deliberately a placeholder, because a story is published with the static
 * Storybook build and a real token would be published with it.
 *
 * So what is reviewable here is the component's own surface — the named
 * `role="application"` region, the sized box, the one-off two-finger hint, and
 * the `unavailableLabel` sentence the region is replaced by when the engine
 * cannot start at all. Every one of those strings is a prop.
 */
const meta = {
  title: 'Maps/DynamicMap',
  component: DynamicMap,
  tags: ['autodocs'],
} satisfies Meta<typeof DynamicMap>;

export default meta;
type Story = StoryObj<typeof meta>;

const base = {
  accessToken: 'pk.storybook-placeholder',
  style: { username: 'mapbox', styleId: 'outdoors-v12' },
  camera: { centre: { longitude: 144.963, latitude: -37.814 }, zoom: 13 },
  height: 360,
};

/** The live half, named from props. With a placeholder token no style loads. */
export const Live: Story = {
  args: { ...base, label: 'The site’s location' },
};

/** Every string is a prop: an app with its own copy, or its own language, passes it. */
export const CopyIsAProp: Story = {
  args: {
    ...base,
    label: 'Emplacement du site',
    panHintLabel: 'Utilisez deux doigts pour déplacer la carte',
    unavailableLabel: 'Carte indisponible',
  },
};
