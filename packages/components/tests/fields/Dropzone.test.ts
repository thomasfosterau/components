import { userEvent } from 'vite-plus/test/browser';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import DropzoneFixture from './fixtures/DropzoneFixture.svelte';

const makeFile = (name: string, type: string, bytes = 10): File =>
  new File([new Uint8Array(bytes)], name, { type });

/** Drop `files` on the zone, the way a browser delivers a drag from the desktop. */
const dropOn = (zone: Element, files: readonly File[]): void => {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  zone.dispatchEvent(
    new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: transfer }),
  );
  zone.dispatchEvent(
    new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }),
  );
};

afterEach(() => {
  vi.restoreAllMocks();
});

test('the way in is a real button named by the label; the native input is multiple with accept', async () => {
  const screen = await render(DropzoneFixture, { accept: 'image/*' });

  const choose = screen.getByRole('button', { name: 'Attachments' });
  await expect.element(choose).toHaveTextContent('Choose files');
  await expect.element(choose).toHaveAccessibleDescription(/Photos or PDFs\./);
  const native = screen.container.querySelector('input[type="file"]');
  expect(native?.hasAttribute('multiple')).toBe(true);
  expect(native?.getAttribute('accept')).toBe('image/*');
});

test('a drop of two files lists both and updates the bound files', async () => {
  const screen = await render(DropzoneFixture, {});

  dropOn(screen.getByTestId('zone').element(), [
    makeFile('plan.pdf', 'application/pdf'),
    makeFile('bed.png', 'image/png'),
  ]);

  await expect.element(screen.getByTestId('bound')).toHaveTextContent('plan.pdf|bed.png');
  expect(screen.getByRole('listitem').elements()).toHaveLength(2);
  await expect.element(screen.getByText('2 files selected')).toBeInTheDocument();
});

test('a file over maxBytes is rejected, explained, and reported to onSelect', async () => {
  const onSelect = vi.fn();
  const screen = await render(DropzoneFixture, { maxBytes: 100, onSelect });

  const big = makeFile('huge.pdf', 'application/pdf', 500);
  dropOn(screen.getByTestId('zone').element(), [big]);

  await expect.element(screen.getByRole('alert')).toHaveTextContent('huge.pdf is too large.');
  expect(onSelect).toHaveBeenCalledWith([], [{ file: big, reason: 'too-large' }]);
  await expect
    .element(screen.getByRole('button', { name: 'Attachments' }))
    .toHaveAccessibleDescription(/huge\.pdf is too large\./);
});

test('accept is enforced on drop', async () => {
  const onSelect = vi.fn();
  const screen = await render(DropzoneFixture, { accept: 'image/*', onSelect });

  const exe = makeFile('setup.exe', 'application/x-msdownload');
  dropOn(screen.getByTestId('zone').element(), [exe]);

  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('setup.exe is not an accepted file type.');
  expect(onSelect).toHaveBeenCalledWith([], [{ file: exe, reason: 'wrong-type' }]);
});

test('maxFiles keeps the first files and rejects the rest as too many', async () => {
  const onSelect = vi.fn();
  const screen = await render(DropzoneFixture, { maxFiles: 2, onSelect });

  const three = [
    makeFile('a.png', 'image/png'),
    makeFile('b.png', 'image/png'),
    makeFile('c.png', 'image/png'),
  ];
  dropOn(screen.getByTestId('zone').element(), three);

  await expect.element(screen.getByTestId('bound')).toHaveTextContent('a.png|b.png');
  expect(onSelect.mock.calls[0]?.[1]).toEqual([{ file: three[2], reason: 'too-many' }]);
  await expect.element(screen.getByRole('alert')).toHaveTextContent('Choose at most 2 files.');
});

test('a remove button removes its file and focus lands on the next one, then the choose button', async () => {
  const screen = await render(DropzoneFixture, {
    files: [makeFile('plan.pdf', 'application/pdf'), makeFile('notes.pdf', 'application/pdf')],
  });

  await userEvent.click(screen.getByRole('button', { name: 'Remove plan.pdf' }));
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('notes.pdf');
  await expect.element(screen.getByRole('button', { name: 'Remove notes.pdf' })).toHaveFocus();

  await userEvent.click(screen.getByRole('button', { name: 'Remove notes.pdf' }));
  await expect.element(screen.getByRole('button', { name: 'Attachments' })).toHaveFocus();
});

test('a wrapping form posts the listed files under name', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(DropzoneFixture, { onSubmitted });

  dropOn(screen.getByTestId('zone').element(), [
    makeFile('a.pdf', 'application/pdf'),
    makeFile('b.pdf', 'application/pdf'),
  ]);
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('a.pdf|b.pdf');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const data = onSubmitted.mock.calls[0]?.[0] as FormData;
  expect(data.getAll('attachments').map((entry) => (entry as File).name)).toEqual([
    'a.pdf',
    'b.pdf',
  ]);
});

test('image previews use object URLs that are revoked on removal', async () => {
  const revoke = vi.spyOn(URL, 'revokeObjectURL');
  const screen = await render(DropzoneFixture, { files: [makeFile('bed.png', 'image/png')] });

  const thumbnail = screen.container.querySelector('li img');
  expect(thumbnail?.getAttribute('src')).toMatch(/^blob:/);
  const url = thumbnail?.getAttribute('src');

  await userEvent.click(screen.getByRole('button', { name: 'Remove bed.png' }));
  await vi.waitFor(() => expect(revoke).toHaveBeenCalledWith(url));
});

test('a single-file zone replaces its file on the next drop', async () => {
  const screen = await render(DropzoneFixture, { multiple: false });

  dropOn(screen.getByTestId('zone').element(), [makeFile('one.pdf', 'application/pdf')]);
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('one.pdf');
  dropOn(screen.getByTestId('zone').element(), [makeFile('two.pdf', 'application/pdf')]);
  await expect.element(screen.getByTestId('bound')).toHaveTextContent(/^two\.pdf$/);
});
