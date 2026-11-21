/**
 * `AudioPlayer` over a real `<audio>` playing generated silence (20 s).
 * Playback starts from a real click, which satisfies the autoplay policy.
 */

import { createRawSnippet } from 'svelte';
import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import AudioPlayer from '../../src/lib/media/AudioPlayer.svelte';
import { clampTime, formatClock, spokenTime } from '../../src/lib/media/audio-time.ts';
import { silentWav } from './fixtures/silent-wav.ts';

const src = silentWav(20);

const audioOf = (screen: Awaited<ReturnType<typeof render>>): HTMLAudioElement => {
  const element = screen.container.querySelector('audio');
  if (!(element instanceof HTMLAudioElement)) throw new Error('no audio element');
  return element;
};

/** Render, and wait until the duration is known and the seek slider is live. */
async function loaded(props: Record<string, unknown> = {}) {
  const screen = await render(AudioPlayer, { src, title: 'Blackbird song', ...props });
  await expect
    .element(screen.getByRole('slider', { name: 'Seek' }))
    .not.toHaveAttribute('aria-disabled', 'true');
  await expect.poll(() => audioOf(screen).duration).toBeCloseTo(20, 0);
  return screen;
}

test('a named group whose play button keeps its name and reports pressed', async () => {
  const screen = await loaded();
  await expect.element(screen.getByRole('group', { name: 'Blackbird song' })).toBeVisible();
  const play = screen.getByRole('button', { name: 'Play' });
  await expect.element(play).toHaveAttribute('aria-pressed', 'false');

  await play.click();
  await expect.poll(() => audioOf(screen).paused).toBe(false);
  await expect.element(play).toHaveAttribute('aria-pressed', 'true');

  await play.click();
  await expect.poll(() => audioOf(screen).paused).toBe(true);
});

test('playback advances: the seek slider does not snap it back to a whole second', async () => {
  const screen = await loaded();
  await screen.getByRole('button', { name: 'Play' }).click();
  await expect.poll(() => audioOf(screen).currentTime, { timeout: 5000 }).toBeGreaterThan(1.2);
});

test('the seek slider moves 5 s on arrows, ends on End, and speaks the long form', async () => {
  const screen = await loaded();
  const seek = screen.getByRole('slider', { name: 'Seek' });
  await expect.element(seek).toHaveAttribute('aria-valuetext', '0 seconds of 20 seconds');

  seek.element().focus();
  await userEvent.keyboard('{Home}');
  await userEvent.keyboard('{ArrowRight}');
  await expect.poll(() => audioOf(screen).currentTime).toBeCloseTo(5, 0);
  await expect.element(seek).toHaveAttribute('aria-valuetext', '5 seconds of 20 seconds');

  await userEvent.keyboard('{ArrowLeft}');
  await expect.poll(() => audioOf(screen).currentTime).toBeCloseTo(0, 0);

  await userEvent.keyboard('{End}');
  await expect.poll(() => audioOf(screen).currentTime).toBeCloseTo(20, 0);
});

test('the skip buttons move by `skip` seconds, clamped to the clip', async () => {
  const screen = await loaded();
  await screen.getByRole('button', { name: 'Forward 15 seconds' }).click();
  await expect.poll(() => audioOf(screen).currentTime).toBeCloseTo(15, 0);
  await screen.getByRole('button', { name: 'Forward 15 seconds' }).click();
  await expect.poll(() => audioOf(screen).currentTime).toBeCloseTo(20, 0);
  await screen.getByRole('button', { name: 'Back 15 seconds' }).click();
  await expect.poll(() => audioOf(screen).currentTime).toBeCloseTo(5, 0);
});

test('the speed menu sets the playback rate', async () => {
  const screen = await loaded();
  await screen.getByRole('combobox', { name: 'Playback speed' }).selectOptions('1.5×');
  await expect.poll(() => audioOf(screen).playbackRate).toBe(1.5);
});

test('mute is a toggle button over the element', async () => {
  const screen = await loaded();
  const mute = screen.getByRole('button', { name: 'Mute' });
  await mute.click();
  await expect.element(mute).toHaveAttribute('aria-pressed', 'true');
  expect(audioOf(screen).muted).toBe(true);
});

test('shortcuts act while focus is inside, and not from outside', async () => {
  const screen = await loaded();
  screen.getByRole('slider', { name: 'Seek' }).element().focus();
  await userEvent.keyboard('{Home}');

  await userEvent.keyboard('l');
  await expect.poll(() => audioOf(screen).currentTime).toBeCloseTo(15, 0);
  await userEvent.keyboard('m');
  expect(audioOf(screen).muted).toBe(true);
  await userEvent.keyboard('k');
  await expect.poll(() => audioOf(screen).paused).toBe(false);
  await userEvent.keyboard(' ');
  await expect.poll(() => audioOf(screen).paused).toBe(true);

  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  await userEvent.keyboard('k');
  expect(audioOf(screen).paused).toBe(true);
});

test('Space on the play button presses it once, not twice', async () => {
  const screen = await loaded();
  screen.getByRole('button', { name: 'Play' }).element().focus();
  await userEvent.keyboard(' ');
  await expect.poll(() => audioOf(screen).paused).toBe(false);
});

test('a transcript renders in a disclosure', async () => {
  const transcript = createRawSnippet(() => ({
    render: () => '<p>A blackbird sings at dusk.</p>',
  }));
  const screen = await loaded({ transcript });
  await screen.getByText('Transcript').click();
  await expect.element(screen.getByText('A blackbird sings at dusk.')).toBeVisible();
});

test('Media Session metadata is set while playing and cleared on pause', async () => {
  const screen = await loaded({ artist: 'Turdus merula' });
  await screen.getByRole('button', { name: 'Play' }).click();
  await expect.poll(() => navigator.mediaSession.metadata?.title).toBe('Blackbird song');
  expect(navigator.mediaSession.metadata?.artist).toBe('Turdus merula');
  await screen.getByRole('button', { name: 'Play' }).click();
  await expect.poll(() => navigator.mediaSession.metadata).toBeNull();
});

test('time helpers', () => {
  expect(formatClock(65)).toBe('1:05');
  expect(formatClock(3725)).toBe('1:02:05');
  expect(formatClock(Number.NaN)).toBe('0:00');
  expect(spokenTime(65, 'en')).toBe('1 minute, 5 seconds');
  expect(clampTime(25, 20)).toBe(20);
  expect(clampTime(-3, 20)).toBe(0);
  expect(clampTime(25, Number.NaN)).toBe(25);
});
