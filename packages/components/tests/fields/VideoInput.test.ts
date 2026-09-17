import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import VideoInput from '../../src/lib/fields/VideoInput.svelte';
import VideoInputFixture from './fixtures/VideoInputFixture.svelte';
import { textFile } from './files.ts';

test('is a file input defaulting to video, with no progress bar to begin with', async () => {
  const screen = await render(VideoInput, {
    'aria-label': 'Video',
    'data-testid': 'file',
  });

  await expect.element(screen.getByTestId('file')).toHaveAttribute('accept', 'video/*');
  expect(screen.getByRole('progressbar').elements()).toHaveLength(0);
});

test('choosing a file hands it to the caller, which owns the transfer', async () => {
  const onSelect = vi.fn();
  const screen = await render(VideoInput, {
    'aria-label': 'Video',
    accept: 'text/plain',
    onSelect,
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(textFile('clip.txt', 10));

  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect.mock.calls[0]?.[0]).toBeInstanceOf(File);
});

test('the progress bar appears while a transfer is in flight, named by progressLabel', async () => {
  // The caller owns the transfer, so the fixture plays that part: it reports
  // progress the moment a file is chosen, exactly as an upload client would.
  const screen = await render(VideoInputFixture, { startAt: 42 });

  await screen.getByTestId('file').upload(textFile('clip.txt', 10));

  const bar = screen.getByRole('progressbar', { name: 'Uploading the video' });
  await expect.element(bar).toBeInTheDocument();
  await expect.element(bar).toHaveAttribute('value', '42');
});

test('a finished transfer takes the bar away again', async () => {
  const screen = await render(VideoInputFixture, { startAt: 100 });

  await screen.getByTestId('file').upload(textFile('clip.txt', 10));

  expect(screen.getByRole('progressbar').elements()).toHaveLength(0);
});

test('a file over maxBytes is refused by the shared FileInput machinery', async () => {
  const screen = await render(VideoInput, {
    'aria-label': 'Video',
    accept: 'text/plain',
    maxBytes: 16,
    tooLargeMessage: 'That video is larger than 16 bytes.',
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(textFile('clip.txt', 64));

  await expect.element(screen.getByRole('alert')).toHaveTextContent('larger than 16 bytes');
});
