import type { Meta, StoryObj } from '@storybook/sveltekit';
import Video from '../../lib/media/Video.svelte';

const meta = {
  title: 'Media/Video',
  component: Video,
  args: { title: 'Spring garden tour' },
  parameters: {
    docs: {
      description: {
        component:
          'A plain `<video>` over an HLS manifest, with a poster and an upload-lifecycle placeholder for when the manifest is not ready yet.',
      },
    },
  },
} satisfies Meta<typeof Video>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  args: {
    hlsUrl: 'https://videodelivery.net/example/manifest/video.m3u8',
    posterUrl: 'https://placehold.co/640x360',
    width: 640,
    height: 360,
  },
};

export const WithCaptions: Story = {
  args: {
    hlsUrl: 'https://videodelivery.net/example/manifest/video.m3u8',
    posterUrl: 'https://placehold.co/640x360',
    captionsSrc: 'https://example.com/captions/en.vtt',
    width: 640,
    height: 360,
  },
};

export const Pending: Story = {
  args: {
    uploadState: 'pending',
    statusLabel: 'Waiting for upload',
    posterUrl: 'https://placehold.co/640x360',
  },
};

export const Processing: Story = {
  args: {
    uploadState: 'processing',
    statusLabel: 'Processing…',
    posterUrl: 'https://placehold.co/640x360',
  },
};

export const Failed: Story = {
  args: {
    uploadState: 'failed',
    statusLabel: 'Upload failed',
  },
};
