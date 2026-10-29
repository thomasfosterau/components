import { expect, test } from 'vite-plus/test';
import {
  acceptMatches,
  exceedsSize,
  formatFileSize,
} from '../../src/lib/fields/file-validation.ts';

const file = (name: string, type: string, bytes = 1): File =>
  new File([new Uint8Array(bytes)], name, { type });

test('acceptMatches reads the native accept syntax', () => {
  expect(acceptMatches(file('a.PNG', 'image/png'), 'image/*')).toBe(true);
  expect(acceptMatches(file('a.pdf', 'application/pdf'), 'image/*')).toBe(false);
  expect(acceptMatches(file('Report.PDF', ''), '.pdf, .docx')).toBe(true);
  expect(acceptMatches(file('data.json', 'application/json'), 'application/json')).toBe(true);
  expect(acceptMatches(file('anything.bin', ''), undefined)).toBe(true);
  expect(acceptMatches(file('anything.bin', ''), ' ')).toBe(true);
});

test('exceedsSize only with a cap', () => {
  expect(exceedsSize(file('a', '', 10), 5)).toBe(true);
  expect(exceedsSize(file('a', '', 5), 5)).toBe(false);
  expect(exceedsSize(file('a', '', 10), undefined)).toBe(false);
});

test('formatFileSize picks the unit', () => {
  expect(formatFileSize(820, 'en-AU')).toBe('820 byte');
  expect(formatFileSize(820_000, 'en-AU')).toBe('820 kB');
  expect(formatFileSize(4_200_000, 'en-AU')).toBe('4.2 MB');
  expect(formatFileSize(0, 'en-AU')).toBe('0 byte');
});
