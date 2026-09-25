import { expect, test } from 'vite-plus/test';
import { imageDimensions } from '../../src/lib/media/image-dimensions.ts';

const png = async (width: number, height: number): Promise<Blob> => {
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext('2d')?.fillRect(0, 0, width, height);
  return canvas.convertToBlob({ type: 'image/png' });
};

test('reads the intrinsic pixel size of an image file', async () => {
  expect(await imageDimensions(await png(64, 48))).toEqual({ width: 64, height: 48 });
});

test('rejects a file that does not decode as an image', async () => {
  await expect(
    imageDimensions(new Blob(['not an image'], { type: 'text/plain' })),
  ).rejects.toThrow();
});
