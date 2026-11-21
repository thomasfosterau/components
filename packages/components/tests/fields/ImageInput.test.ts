import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ImageInput from '../../src/lib/fields/ImageInput.svelte';
import { fileFromDataUrl, PNG_3x2, textFile } from './files.ts';
import { instanceOf } from '../dom.ts';

test('measures the picture’s intrinsic size and shows it under the preview', async () => {
  const screen = await render(ImageInput, {
    'aria-label': 'Photograph',
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(await fileFromDataUrl(PNG_3x2, 'tiny.png', 'image/png'));

  // The probe is `createImageBitmap`, so this is a real decode of a real PNG.
  await expect.element(screen.getByText('3 × 2')).toBeInTheDocument();
});

test('the preview is an object URL named by previewAlt', async () => {
  const screen = await render(ImageInput, {
    'aria-label': 'Photograph',
    previewAlt: 'The photograph you chose',
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(await fileFromDataUrl(PNG_3x2, 'tiny.png', 'image/png'));

  const preview = screen.getByRole('img', { name: 'The photograph you chose' });
  await expect.element(preview).toBeInTheDocument();
  expect(instanceOf(preview.element(), HTMLImageElement).src.startsWith('blob:')).toBe(true);
});

test('the measured dimensions ride along as hidden inputs once `name` is set', async () => {
  const screen = await render(ImageInput, {
    'aria-label': 'Photograph',
    name: 'file',
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(await fileFromDataUrl(PNG_3x2, 'tiny.png', 'image/png'));
  await expect.element(screen.getByText('3 × 2')).toBeInTheDocument();

  expect(screen.container.querySelector<HTMLInputElement>('input[name="width"]')?.value).toBe('3');
  expect(screen.container.querySelector<HTMLInputElement>('input[name="height"]')?.value).toBe('2');
});

test('nothing is measured and nothing is posted without a name', async () => {
  const screen = await render(ImageInput, {
    'aria-label': 'Photograph',
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(await fileFromDataUrl(PNG_3x2, 'tiny.png', 'image/png'));
  await expect.element(screen.getByText('3 × 2')).toBeInTheDocument();

  expect(screen.container.querySelector('input[name="width"]')).toBeNull();
});

test('a file the browser cannot decode leaves the dimensions unset and does not block', async () => {
  const screen = await render(ImageInput, {
    'aria-label': 'Photograph',
    name: 'file',
    accept: 'image/png,text/plain',
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(textFile('not-a-picture.txt', 32));

  await expect.element(screen.getByRole('img')).toBeInTheDocument();
  expect(screen.container.querySelector('input[name="width"]')).toBeNull();
});

const cropped = async (crop: Record<string, unknown>, props: Record<string, unknown> = {}) => {
  const screen = await render(ImageInput, {
    'aria-label': 'Photograph',
    'data-testid': 'file',
    name: 'file',
    crop,
    ...props,
  });
  await screen.getByTestId('file').upload(await fileFromDataUrl(PNG_3x2, 'tiny.png', 'image/png'));
  return screen;
};

test('with `crop`, choosing a file opens the cropper in a dialog', async () => {
  const screen = await cropped({ aspect: 1 });

  const dialog = screen.getByRole('dialog', { name: 'Crop image' });
  await expect.element(dialog).toBeInTheDocument();
  await expect.element(dialog.getByRole('group', { name: 'Crop area' })).toBeInTheDocument();
});

test('Apply with `output: blob` replaces the file with the cropped image', async () => {
  const screen = await cropped({ aspect: 1, output: 'blob' });

  const apply = screen.getByRole('button', { name: 'Apply' });
  await expect.element(apply).toBeEnabled();
  await apply.click();

  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  await expect.element(screen.getByText('2 × 2')).toBeInTheDocument();
  const input = instanceOf(screen.getByTestId('file').element(), HTMLInputElement);
  const file = input.files?.[0];
  expect(file?.name).toBe('tiny.png');
  const bitmap = await createImageBitmap(file ?? new Blob());
  expect([bitmap.width, bitmap.height]).toEqual([2, 2]);
  expect(screen.container.querySelector('input[name="cropWidth"]')).toBeNull();
});

test('Apply with `output: area` keeps the file and posts the crop', async () => {
  const screen = await cropped({ aspect: 1 });

  const apply = screen.getByRole('button', { name: 'Apply' });
  await expect.element(apply).toBeEnabled();
  await apply.click();

  await expect.element(screen.getByText('2 × 2')).toBeInTheDocument();
  expect(screen.container.querySelector<HTMLInputElement>('input[name="width"]')?.value).toBe('3');
  expect(screen.container.querySelector<HTMLInputElement>('input[name="cropWidth"]')?.value).toBe(
    '2',
  );
  expect(screen.container.querySelector<HTMLInputElement>('input[name="cropX"]')?.value).toBe(
    '0.5',
  );
});

test('Cancel keeps the uncropped file and returns focus to the file input', async () => {
  const screen = await cropped({ aspect: 1 });

  await screen.getByRole('button', { name: 'Cancel' }).first().click();

  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  await expect.element(screen.getByTestId('file')).toHaveFocus();
  await expect.element(screen.getByText('3 × 2')).toBeInTheDocument();
  expect(screen.container.querySelector('input[name="cropWidth"]')).toBeNull();
});

test('Edit crop reopens the dialog', async () => {
  const screen = await cropped({ aspect: 1 });
  await screen.getByRole('button', { name: 'Cancel' }).first().click();

  await screen.getByRole('button', { name: 'Edit crop' }).click();

  await expect.element(screen.getByRole('dialog', { name: 'Crop image' })).toBeInTheDocument();
});

test('calls onSelect with the chosen file', async () => {
  const onSelect = vi.fn<(file: File | undefined) => void>();
  const screen = await render(ImageInput, {
    'aria-label': 'Photograph',
    'data-testid': 'file',
    onSelect,
  });

  await screen.getByTestId('file').upload(await fileFromDataUrl(PNG_3x2, 'tiny.png', 'image/png'));

  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'tiny.png' }));
});
