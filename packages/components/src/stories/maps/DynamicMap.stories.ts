import type { Meta, StoryObj } from '@storybook/sveltekit';
import DynamicMap from '../../lib/maps/DynamicMap.svelte';

/**
 * `mapbox-gl` is an optional peer loaded by dynamic `import()`, and it is NOT
 * installed in this repository — so what these stories show is the branch an
 * application that never installed it takes: a sentence, not a blank
 * rectangle. That is the only state this package can render honestly, and it
 * is the one most worth reviewing, because it is the one nobody remembers to
 * design.
 *
 * With the peer installed and a real token, the same component renders the
 * live map; the token is deliberately a placeholder here, because a story is
 * published with the static Storybook build.
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

/** The peer is absent, so this is the unavailable state. */
export const WithoutTheOptionalPeer: Story = {
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
