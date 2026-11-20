/** A blob URL for `seconds` of 8 kHz, 8-bit mono silence: a WAV the browser can play, with no file in the repo. */
export function silentWav(seconds: number): string {
  const rate = 8000;
  const samples = rate * seconds;
  const view = new DataView(new ArrayBuffer(44 + samples));
  const text = (offset: number, value: string): void => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, 'data');
  view.setUint32(40, samples, true);
  for (let index = 0; index < samples; index += 1) view.setUint8(44 + index, 128);
  return URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }));
}
