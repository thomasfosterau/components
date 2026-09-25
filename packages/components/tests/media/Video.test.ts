import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Video from '../../src/lib/media/Video.svelte';

test('renders a playable <video> with the title as its accessible name', async () => {
  const screen = await render(Video, {
    hlsUrl: 'https://videodelivery.net/example/manifest/video.m3u8',
    posterUrl: 'https://example.com/poster.jpg',
    title: 'Spring garden tour',
  });

  const video = screen.container.querySelector('video');
  expect(video).not.toBeNull();
  expect(video?.getAttribute('aria-label')).toBe('Spring garden tour');
  expect(video?.getAttribute('poster')).toBe('https://example.com/poster.jpg');
  expect(video?.hasAttribute('controls')).toBe(true);

  const sourceEl = screen.container.querySelector('source');
  expect(sourceEl?.getAttribute('src')).toBe(
    'https://videodelivery.net/example/manifest/video.m3u8',
  );
  expect(sourceEl?.getAttribute('type')).toBe('application/x-mpegURL');
});

test('renders an empty captions track when captionsSrc is absent', async () => {
  const screen = await render(Video, {
    hlsUrl: 'https://videodelivery.net/example/manifest/video.m3u8',
    title: 'No captions yet',
  });

  const track = screen.container.querySelector('track[kind="captions"]');
  expect(track).not.toBeNull();
  expect(track?.getAttribute('src')).toBeNull();
});

test('renders a real captions track when captionsSrc is given', async () => {
  const screen = await render(Video, {
    hlsUrl: 'https://videodelivery.net/example/manifest/video.m3u8',
    title: 'Captioned',
    captionsSrc: 'https://example.com/captions/en.vtt',
  });

  const track = screen.container.querySelector('track[kind="captions"]');
  expect(track?.getAttribute('src')).toBe('https://example.com/captions/en.vtt');
});

test('renders the poster placeholder and statusLabel badge while not ready', async () => {
  const screen = await render(Video, {
    title: 'Processing video',
    uploadState: 'processing',
    statusLabel: 'Processing…',
    posterUrl: 'https://example.com/poster.jpg',
  });

  expect(screen.container.querySelector('video')).toBeNull();
  await expect.element(screen.getByText('Processing…')).toHaveClass('badge-neutral');
  const poster = screen.container.querySelector('img');
  expect(poster?.getAttribute('src')).toBe('https://example.com/poster.jpg');
  expect(poster?.getAttribute('alt')).toBe('');
});

test('calls onReady with the mounted element once playable', async () => {
  let readyElement: HTMLVideoElement | undefined;

  await render(Video, {
    hlsUrl: 'https://videodelivery.net/example/manifest/video.m3u8',
    title: 'Ready callback',
    onReady: (element) => {
      readyElement = element;
    },
  });

  await expect.poll(() => readyElement).toBeInstanceOf(HTMLVideoElement);
});
