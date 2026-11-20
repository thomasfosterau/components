/** Writes ASCII `value` into `view` at `offset`. */
const writeText = (view: DataView, offset: number, value: string): void => {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
};

/** One sample at `t` seconds: a quarter-second rising chirp every second and a half. */
function chirp(t: number): number {
  const phase = t % 1.5;
  const envelope = phase < 0.25 ? Math.sin((Math.PI * phase) / 0.25) : 0;
  return envelope * 0.3 * Math.sin(2 * Math.PI * (1800 + 2400 * phase) * t);
}

/**
 * A blob URL for a short run of rising chirps, so the audio stories have
 * something to play without a network request or a file in the repo.
 */
export function chirpWav(seconds: number): string {
  const rate = 22_050;
  const samples = rate * seconds;
  const view = new DataView(new ArrayBuffer(44 + samples * 2));
  writeText(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  writeText(view, 8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(view, 36, 'data');
  view.setUint32(40, samples * 2, true);
  for (let index = 0; index < samples; index += 1) {
    view.setInt16(44 + index * 2, Math.round(chirp(index / rate) * 32_767), true);
  }
  return URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }));
}

/** A WebVTT captions file as a blob URL. */
export const captionsVtt = (): string =>
  URL.createObjectURL(
    new Blob(
      [
        'WEBVTT\n\n00:00.000 --> 00:05.000\n[Bird song, rising chirps]\n\n00:05.000 --> 00:12.000\n[Chirps continue]\n',
      ],
      { type: 'text/vtt' },
    ),
  );
